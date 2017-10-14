#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import json  # import ujson as json
import argparse
import fileinput
import StringIO
import gzip
import random

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt, printWroteNumLines
from metadataws import MetadataWS
from files_and_paths import Datasets, Dirs
from exp import Exp

AddPath(__file__, '../../common/')
from constants import paths, chroms
from common import printr, printt
from config import Config

from pcommon import doIntersection, runIntersectJob, processResults


def getFileJson(exp, bed):
    return {"accession": bed.fileID,
            "dataset_accession": exp.encodeID,
            "biosample_term_name": exp.biosample_term_name,
            "assay_term_name": exp.assay_term_name,
            "target": exp.target,
            "label": exp.label}


def makeJobs(assembly):
    if "mm10" == assembly:
        m = MetadataWS(Datasets.all_mouse)
    else:
        m = MetadataWS(Datasets.all_human)

    allExps = [(m.chipseq_tfs_useful(assembly), "tf"),
               (m.chipseq_histones_useful(assembly), "histone")]
    allExpsIndiv = []
    for exps, etype in allExps:
        print("found", len(exps), etype)
        exps = [Exp.fromJsonFile(e.encodeID) for e in exps]
        exps = filter(lambda e: "ERROR" not in e.jsondata["audit"], exps)
        print("found", len(exps), etype, "after removing ERROR audit exps")
        for exp in exps:
            allExpsIndiv.append((exp, etype))
    random.shuffle(allExpsIndiv)
    total = len(allExpsIndiv)

    i = 0
    jobs = []
    for exp, etype in allExpsIndiv:
        i += 1
        try:
            beds = exp.bedFilters(assembly)
            if not beds:
                print("missing", exp)
            for bed in beds:
                jobs.append({"exp": exp,  # this is an Exp
                             "bed": bed,  # this is an ExpFile
                             "i": i,
                             "total": total,
                             "assembly": assembly,
                             "etype": etype})
        except Exception, e:
            print(str(e))
            print("bad exp:", exp)

    print("will run %d jobs" % len(jobs), file=sys.stderr)
    return jobs


def encodeIntersectJob(jobargs, bedfnp):
    exp = jobargs["exp"]
    bed = jobargs["bed"]
    fileJson = getFileJson(exp, bed)
    label = exp.label if jobargs["etype"] != "dnase" else "dnase"
    jobargs.update({"bed": {"fnp": bed.fnp(), "fileID": bed.fileID},
                    "label": label})
    return (fileJson, runIntersectJob(jobargs, bedfnp))


def computeIntersections(args, assembly):
    bedFnp = paths.path(assembly, "extras", "cREs.sorted.bed")
    if not os.path.exists(bedFnp):
        Utils.sortFile(paths.path(assembly, "raw", "cREs.bed"),
                       bedFnp)

    jobs = makeJobs(assembly)

    results = Parallel(n_jobs=args.j)(
        delayed(encodeIntersectJob)(job, bedFnp)
        for job in jobs)

    print("\n")
    printt("merging intersections into hash...")

    processResults(results, paths.path(assembly, "extras", "peakIntersections.json.gz"))


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--list', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print("***********************", assembly)
        if args.list:
            jobs = makeJobs(assembly)
            for j in jobs:
                #print('\t'.join(["list", j["bed"].expID, j["bed"].fileID]))
                print(j["bed"].fileID)
            continue

        printt("intersecting TFs and Histones")
        computeIntersections(args, assembly)

    return 0


if __name__ == '__main__':
    sys.exit(main())

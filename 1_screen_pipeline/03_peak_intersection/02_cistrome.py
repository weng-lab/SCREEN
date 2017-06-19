#!/usr/bin/env python

from __future__ import print_function
import os, sys
import json #import ujson as json
import argparse
import fileinput, StringIO
import gzip
import random

from joblib import Parallel, delayed

from cistromews import CistromeWS

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
            "label": exp.label }

emap = {"tf": "TF", "histone": "histone"}

def makeJobs(assembly, rootpath):
    species = "human" if assembly == "hg19" else "mouse"
    m = CistromeWS(species, "http://bib7.umassmed.edu/ws/cistrome")
    allExps = [(m.chipseq_tfs(), "tf"),
               (m.chipseq_histones(), "histone")]
    allExpsIndiv = []
    for exps, etype in allExps:
        print("found", len(exps), etype)
        for exp in exps:
            allExpsIndiv.append((exp, etype))
    random.shuffle(allExpsIndiv)
    total = len(allExpsIndiv)

    i = 0; jobs = []
    for exp, etype in allExpsIndiv:
        i += 1
        fnp = os.path.join(rootpath, "_".join((emap[etype], species)), exp["fnp"])
        if os.path.exists(fnp):
            jobs.append({"bed": {"fnp": fnp, "fileID": exp["accession"]},
                         "i": i,
                         "label": exp["mark"] if etype == "histone" else exp["factor"],
                         "total": total,
                         "assembly": assembly,
                         "etype": etype })
        else:
            print("warning: file %s not found" % fnp)

    print("will run %d jobs" % len(jobs), file = sys.stderr)
    return jobs

def cistromeIntersectJob(jobargs, bedfnp):
    return (jobargs, runIntersectJob(jobargs, bedfnp))

def computeIntersections(args, assembly):
    bedFnp = paths.path(assembly, "extras", "cREs.sorted.bed")
    if not os.path.exists(bedFnp):
        Utils.sortFile(paths.path(assembly, "raw", "cREs.bed"),
                       bedFnp)

    jobs = makeJobs(assembly, "/data/zusers/pratth/pratth.bib3/cistrome/data/raw")

    results = Parallel(n_jobs = args.j)(
        delayed(cistromeIntersectJob)(job, bedFnp)
        for job in jobs)

    print("\n")
    printt("merging intersections into hash...")

    processResults(results, paths.path(assembly, "extras", "cistromeIntersections.json.gz"))

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

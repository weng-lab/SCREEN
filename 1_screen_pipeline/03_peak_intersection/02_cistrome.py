#!/usr/bin/env python

from __future__ import print_function
import arrow
import os
import sys
import json  # import ujson as json
import argparse
import fileinput
import StringIO
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
            "label": exp.label}


emap = {"tf": "TF", "histone": "histone"}


def loadJobs(assembly, runDate):
    fnp = paths.path(assembly, "extras", runDate, "cistromeJobs.json.gz")

    printt("reading", fnp)
    with gzip.open(fnp) as f:
        jobs = json.load(f)
    printt("loaded", len(jobs))
    return jobs

def makeJobs(assembly, rootpath, runDate, skipCheck = True):
    species = "human" if assembly == "hg19" else "mouse"
    m = CistromeWS(species, "https://api.wenglab.org/cistrome")
    allExps = [(m.chipseq_tfs(), "tf"),
               (m.chipseq_histones(), "histone")]
    allExpsIndiv = []
    for exps, etype in allExps:
        print("found", len(exps), etype)
        for exp in exps:
            allExpsIndiv.append((exp, etype))
    random.shuffle(allExpsIndiv)
    total = len(allExpsIndiv)

    i = 0
    jobs = []
    for exp, etype in allExpsIndiv:
        i += 1
        fnp = os.path.join(rootpath, "_".join((emap[etype], species)), exp["fnp"])
        
        if skipCheck or os.path.exists(fnp):
            jobs.append({"bed": {"fnp": fnp, "fileID": exp["accession"]},
                         "i": i,
                         "celltype": exp["celltype"],
                         "tissue": exp["tissue"],
                         "label": exp["mark"] if etype == "histone" else exp["factor"],
                         "total": total,
                         "assembly": assembly,
                         "etype": etype})
        else:
            print("warning: skipping file %s : not found" % fnp)

    print("will run %d jobs" % len(jobs), file=sys.stderr)

    jobsFnp = paths.path(assembly, "extras", runDate, "cistromeJobs.json.gz")
    jobsOut = []
    for job in jobs:
        j = {"bed": {"expID": job["bed"].expID,
                        "fileID": job["bed"].fileID},
                "etype": job["etype"],
                "exp": {"label": job["exp"].label,
                        "biosample_term_name": job["exp"].biosample_term_name
                        }}            
        jobsOut.append(j)
    with gzip.open(jobsFnp, 'w') as f:
        json.dump(jobsOut, f)
    printt("wrote", jobsFnp)
    
    return jobs


def cistromeIntersectJob(jobargs, bedfnp):
    return (jobargs, runIntersectJob(jobargs, bedfnp))


def computeIntersections(args, assembly):
    bedFnp = paths.path(assembly, "extras", "cREs.sorted.bed")
    if not os.path.exists(bedFnp):
        Utils.sortFile(paths.path(assembly, "raw", "cREs.bed"),
                       bedFnp)

    runDate = arrow.now().format('YYYY-MM-DD')
    jobs = makeJobs(assembly, paths.cistrome("data", "raw"), runDate)

    results = Parallel(n_jobs=args.j)(
        delayed(cistromeIntersectJob)(job, bedFnp)
        for job in jobs)

    print("\n")
    printt("merging intersections into hash...")

    processResults(results, paths.path(assembly, "extras", runDate,
                                       "cistromeIntersections.json.gz"))


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
            jobs = makeJobs(assembly, paths.cistrome("data", "raw"), arrow.now().format('YYYY-MM-DD'))
            for j in jobs:
                #print('\t'.join(["list", j["bed"].expID, j["bed"].fileID]))
                print(j["bed"].fileID)
            continue

        printt("intersecting TFs and Histones")
        # TODO: move this to class like peak intersection
        computeIntersections(args, assembly)

    return 0


if __name__ == '__main__':
    sys.exit(main())

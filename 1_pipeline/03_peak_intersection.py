#!/usr/bin/env python

from __future__ import print_function
import os, sys
import ujson as json
import argparse
import fileinput, StringIO
import gzip
import random

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from constants import paths, chroms
from common import printr, printt

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printWroteNumLines
from metadataws import MetadataWS
from files_and_paths import Datasets, Dirs

def getFileJson(exp, bed):
    return {"accession": bed.fileID,
            "dataset_accession": exp.encodeID,
            "biosample_term_name": exp.biosample_term_name,
            "assay_term_name": exp.assay_term_name,
            "target": exp.target,
            "label": exp.label }

def doIntersection(bed, refnp):
    cmds = ["bedtools", "intersect",
            "-a", refnp,
            "-b", bed.fnp(),
            "-wa"]
    try:
        peaks = Utils.runCmds(cmds)
    except:
        print("failed to run", " ".join(cmds))
        return None

    return [p.rstrip().split("\t")[4] for p in peaks] # return cRE accessions

def makeJobs(assembly):
    if "mm10" == assembly:
        m = MetadataWS(Datasets.all_mouse)
    else:
        m = MetadataWS(Datasets.all_human)

    allExps = [(m.chipseq_tfs_useful(assembly), "tf"),
               (m.chipseq_histones_useful(assembly), "histone"),
               (m.dnases_useful(assembly), "dnase")]
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
        try:
            beds = exp.bedFilters(assembly)
            if not beds:
                print("missing", exp)
            for bed in beds:
                jobs.append({"exp": exp, # this is an Exp
                             "bed": bed, # this is an ExpFile
                             "i": i,
                             "total": total,
                             "assembly": assembly,
                             "etype": etype })
        except Exception, e:
            print(str(e))
            print("bad exp:", exp)

    print("will run", len(jobs), "jobs")
    return jobs

def runIntersectJob(jobargs, bedfnp):
    exp = jobargs["exp"]
    bed = jobargs["bed"]
    fileJson = getFileJson(exp, bed)
    label = exp.label if jobargs["etype"] != "dnase" else "dnase"
    if not os.path.exists(bed.fnp()):
        print("warning: missing bed", bed.fnp(), "-- cannot intersect")
        return (fileJson, None)

    ret = []
    printr("(exp %d of %d)" % (jobargs["i"], jobargs["total"]),
           "intersecting", jobargs["etype"], label)
    accessions = doIntersection(bed, bedfnp)
    if accessions is None:
        print("warning: unable to intersect REs with bed %s" % bed.fnp())
    else:
        ret.append((jobargs["etype"], label, bed.fileID, accessions))
    return (fileJson, ret)

def computeIntersections(args, assembly):
    bedFnp = paths.path(assembly, "extras", "cREs.sorted.bed")

    jobs = makeJobs(assembly)

    results = Parallel(n_jobs = args.j)(
        delayed(runIntersectJob)(job, bedFnp)
        for job in jobs)

    print("\n")
    printt("merging intersections into hash...")

    tfImap = {}
    fileJsons = []
    for fileJson, accessions in results:
        if not accessions:
            continue
        for etype, label, fileID, accs in accessions:
            for acc in accs:
                if acc not in tfImap:
                    tfImap[acc] = {"tf": {}, "histone": {}, "dnase": {}}
                if label not in tfImap[acc][etype]:
                    tfImap[acc][etype][label] = []
                tfImap[acc][etype][label].append(fileID)
        fileJsons += fileJson

    printt("completed hash merge")

    outFnp = paths.path(assembly, "extras", "peakIntersections.json.gz")
    with gzip.open(outFnp, 'w') as f:
        for k,v in tfImap.iteritems():
            f.write('\t'.join([k, json.dumps(v["tf"]),
                               json.dumps(v["histone"]),
                               json.dumps(v["dnase"])]) + '\n')
    printt("wrote", outFnp)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--list', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="mm10")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    if args.list:
        jobs = makeJobs(args, args.assembly)
        for j in jobs:
            #print('\t'.join(["list", j["bed"].expID, j["bed"].fileID]))
            print(j["bed"].fileID)
        return 0

    printt("intersecting TFs, Histones, and DNases")
    computeIntersections(args, args.assembly)

    return 0

if __name__ == '__main__':
    sys.exit(main())

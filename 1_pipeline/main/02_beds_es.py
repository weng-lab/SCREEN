#!/usr/bin/env python

from __future__ import print_function
import os, sys
import ujson as json
import psycopg2
import argparse
import fileinput, StringIO
import gzip
import redis
import random

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from common import printr, printt

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils, printWroteNumLines
from metadataws import MetadataWS
from files_and_paths import Datasets, Dirs

def as_bed(re):
    return "\t".join([re["position"]["chrom"],
                      str(re["position"]["start"]),
                      str(re["position"]["end"]),
                      re["accession"]])

def lsj_to_beds(inFnp):
    ret = []
    with gzip.open(inFnp, "r") as f:
        for idx, line in enumerate(f):
            re = json.loads(line.strip())
            ret.append(as_bed(re))
            if idx % 100000 == 0:
                print("working with", idx, inFnp)
    return ret

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

    return [p.rstrip().split("\t")[3] for p in peaks] # return accessions?

def makeJobs(args, assembly):
    if "mm10" == assembly:
        m = MetadataWS(Datasets.all_mouse)
    else:
        m = MetadataWS(Datasets.all_human)

    allExps = [(m.chipseq_tfs_useful(assembly, args), "tf"),
               (m.chipseq_histones_useful(assembly, args), "histone"),
               (m.dnases_useful(assembly, args), "dnase")]
    allExpsIndiv = []
    for exps, etype in allExps:
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
                jobs.append({"exp": exp,
                             "bed": bed,
                             "i": i,
                             "total": total,
                             "assembly": assembly,
                             "etype": etype })
        except Exception, e:
            print(str(e))
            print("bad exp:", exp)

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
    if "hg19" == jobargs["assembly"]:
        printr("(exp %d of %d)" % (jobargs["i"], jobargs["total"]),
               "intersecting", jobargs["etype"], label)
        accessions = doIntersection(bed, bedfnp)
        if accessions is None:
            print("warning: unable to intersect REs with bed %s" % bed.fnp())
        else:
            ret.append((jobargs["etype"], label, bed.fileID, accessions))
    return (fileJson, ret)

def computeIntersections(args, assembly, fnps):
    bedFnp = fnps["re_bed"]

    jobs = makeJobs(args, assembly)
    results = Parallel(n_jobs = args.j)(delayed(runIntersectJob)(job, bedFnp)
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

    r = redis.StrictRedis()
    for k,v in tfImap.iteritems():
        r.set(paths.reVerStr + k, json.dumps(v))
    printt("wrote to redis")

    bedsLsjFnp = fnps["bedLsjFnp"]
    with open(bedsLsjFnp, "wb") as f:
        for fj in fileJsons:
            f.write(json.dumps(fj) + "\n")
    printt("wrote", bedsLsjFnp)

def extractREbeds(args, fnps):
    printt("generating RE bed file")
    bedFnp = fnps["re_bed"]
    inFnps = fnps["rewriteGeneFnp"]

    jobs = []
    for inFnp in inFnps:
        if not os.path.exists(inFnp):
            continue
        jobs.append(inFnp)

    outputs = Parallel(n_jobs = args.j)(delayed(lsj_to_beds)(j) for j in jobs)

    with gzip.open(bedFnp, "w") as o:
        for output in outputs:
            for re in output:
                o.write(re + "\n")
    print("wrote", bedFnp)

def updateREjson(inFnp, outFnp):
    if not os.path.exists(inFnp):
        print("missing", inFnp)
        return

    r = redis.StrictRedis()

    with gzip.open(inFnp, "r") as inF:
        with gzip.open(outFnp, "w") as outF:
            for idx, line in enumerate(inF):
                if 0 == idx % 10000:
                    print(inFnp, idx)
                re = json.loads(line)

                try:
                    acc = re["accession"]
                    info = r.get(paths.reVerStr + acc)

                    if info:
                        re["peak_intersections"] = json.loads(info)
                    else:
                        re["peak_intersections"] = {"tf": {}, "histone": {}, "dnase": {}}
                        print("no intersections found for", re["accession"])
                except:
                    print("error with", inFnp, "line", idx)
                    continue

                try:
                    outF.write(json.dumps(re) + "\n")
                except:
                    print("could not rewrite", inFnp, "line", idx)
                    continue

    print("wrote", outFnp)

def updateREfiles(args, fnps):
    printt("updating RE JSON")

    inFnps = fnps["rewriteGeneFnp"]
    outFnps = fnps["rewriteGenePeaksFnp"]

    printt("running RE file rewrite....")
    Parallel(n_jobs = args.j)(delayed(updateREjson)(inFnp, outFnp)
                              for (inFnp, outFnp) in zip(inFnps, outFnps))

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--process', action="store_true", default=True)
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--remakeBed', action="store_true", default=False)
    parser.add_argument('--updateOnly', action="store_true", default=False)
    parser.add_argument('--version', type=int, default=7)
    parser.add_argument('--assembly', type=str, default="hg19")
    parser.add_argument('--test', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    fnps = paths.get_paths(args.version, chroms[args.assembly])

    if args.updateOnly:
        return updateREfiles(args, fnps)

    if not os.path.exists(fnps["re_bed"]) or args.remakeBed:
        extractREbeds(args, fnps)

    printt("intersecting TFs, Histones, and DNases")
    computeIntersections(args, args.assembly, fnps)

    updateREfiles(args, fnps)

    return 0

if __name__ == '__main__':
    sys.exit(main())

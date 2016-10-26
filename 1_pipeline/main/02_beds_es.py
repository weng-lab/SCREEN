#!/usr/bin/env python

import os, sys
import json
import psycopg2
import argparse
import fileinput, StringIO
import gzip

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from common import printr, printt

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils, printWroteNumLines
from metadataws import MetadataWS
from files_and_paths import Datasets, Dirs

_alines = []

def as_bed(re):
    return "\t".join([re["position"]["chrom"],
                      str(re["position"]["start"]),
                      str(re["position"]["end"]),
                      re["accession"]])

def lsj_to_beds(inFnp, outfnp):
    output = []
    with gzip.open(inFnp, "r") as f:
        for idx, line in enumerate(f):
            el = json.loads(line.strip())
            output.append(as_bed(el))
            if idx % 100000 == 0:
                printr("working with regelm %d (%s)" % (idx, inFnp))

    with gzip.open(outfnp, "ab") as o:
        for re in output:
            o.write(re + "\n")

def updateREjson(inFnp, tf_imap):
    if not os.path.exists(inFnp):
        return
    outFnp = inFnp.replace(".gz", "._tmp.gz")
    with gzip.open(inFnp, "r") as f:
        with gzip.open(outFnp, "wb") as o:
            for idx, line in enumerate(f):
                if idx % 100000 == 0: printr("working with RE %d" % (idx + 1))
                re = json.loads(line)
                re["accession"] = unicode(re["accession"])
                if re["accession"] in tf_imap:
                    re["peak_intersections"] = tf_imap[re["accession"]]
                else:
                    re["peak_intersections"] = {"tf": {}, "histone": {}, "dnase": {}}
                o.write(json.dumps(re) + "\n")
    print("wrote", outFnp)

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

    return [p.split("\t")[3] for p in peaks] # return accessions?

def makeJobs(args, assembly):
    if "mm10" == assembly:
        m = MetadataWS(Datasets.all_mouse)
    else:
        m = MetadataWS(Datasets.all_human)

    i = 0
    jobs = []
    for exps, etype in [(m.chipseq_tfs_useful(assembly, args), "tf"),
                        (m.chipseq_histones_useful(assembly, args), "histone"),
                        (m.dnases_useful(assembly, args), "dnase")]:
        for exp in exps:
            i += 1
            try:
                beds = exp.bedFilters(assembly)
                if not beds:
                    print "missing", exp
                for bed in beds:
                    jobs.append({"exp": exp,
                                 "bed": bed,
                                 "i": i,
                                 "total": len(exps),
                                 "assembly": assembly,
                                 "map": etype })
            except Exception, e:
                print str(e)
                print "bad exp:", exp

    return jobs

def runIntersectJob(jobargs, bedfnp):
    results = []
    exp = jobargs["exp"]
    bed = jobargs["bed"]
    retval = getFileJson(exp, bed)
    label = exp.label if jobargs["map"] != "dnase" else "dnase"
    if not os.path.exists(bed.fnp()):
        print("warning: missing bed %s; cannot intersect" % bed.fnp())
        return (retval, None)

    if "hg19" == jobargs["assembly"]:
        printr("intersecting TF %s (exp %d of %d)" % (label, jobargs["i"], jobargs["total"]))
        result = doIntersection(bed, bedfnp)
        if result is None:
            print("warning: unable to intersect REs with bed %s" % bed.fnp())
        else:
            results.append((jobargs["map"], label, bed.fileID, result))
    return (retval, results)

def assembly_json(args, assembly, inFnps, bedfnp):
    tf_imap = {}
    files = []
    jobs = makeJobs(args, assembly)
    results = Parallel(n_jobs = args.j)(delayed(runIntersectJob)(_args, bedfnp) for _args in jobs)
    for rfiles, intersections in results:
        if not intersections:
            continue
        for key, label, bed, accs in intersections:
            for acc in accs:
                if acc not in tf_imap: tf_imap[acc] = {"tf": {}, "histone": {}, "dnase": {}}
                if label not in tf_imap[acc][key]: tf_imap[acc][key][label] = []
                tf_imap[acc][key][label].append(bed)
        files += rfiles
    printt("\n\nupdating RE JSON")
    Parallel(n_jobs = args.j)(delayed(updateREjson)(inFnp, tf_imap) for inFnp in inFnps)
    return files

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--process', action="store_true", default=True)
    parser.add_argument('-j', type=int, default=1)
    parser.add_argument('--remake_bed', action="store_true", default=False)
    parser.add_argument('--version', type=int, default=7)
    parser.add_argument('--assembly', type=str, default="hg19")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    files = []
    fnps = paths.get_paths(args.version, chroms[args.assembly])
    inFnps = fnps["rewriteFnp"]
    bed_fnp = fnps["re_bed"]
    print(bed_fnp)

    if not os.path.exists(bed_fnp) or args.remake_bed:
        printt("generating RE bed file")
        with open(bed_fnp, "wb") as o:
            pass # truncate existing file
        for inFnp in inFnps:
            if not os.path.exists(inFnp):
                continue
            lsj_to_beds(inFnp, bed_fnp)
        print("\n")

    printt("intersecting TFs")
    files += assembly_json(args, args.assembly, in_fnps, bed_fnp)
    with open(os.path.join(Dirs.encyclopedia, "Version-4", "beds.lsj"), "wb") as o:
        for f in files:
            o.write(json.dumps(f) + "\n")
    print("\n")
    printt("wrote %s" % os.path.join(Dirs.encyclopedia, "Version-4", "beds.lsj"))
    return 0

if __name__ == '__main__':
    sys.exit(main())

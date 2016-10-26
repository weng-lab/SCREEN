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

def as_bed(el):
    return "\t".join([el["position"]["chrom"],
                      str(el["position"]["start"]),
                      str(el["position"]["end"]),
                      el["accession"]])

def lsj_to_beds(infnp, outfnp):
    output = []

    i = 0

    with gzip.open(infnp, "r") as f:
        for line in f:
            el = json.loads(line.strip())
            output.append(as_bed(el))
            i += 1
            if i % 100000 == 0: printr("working with regelm %d (%s)" % (i, infnp))

    with gzip.open(outfnp, "ab") as o:
        for el in output:
            o.write(el + "\n")

def update_lsj(infnp, tf_imap):
    if not os.path.exists(infnp): return
    i = 0
    with gzip.open(infnp, "r") as f:
        with gzip.open(infnp.replace(".gz", "._tmp.gz"), "wb") as o:
            for line in f:
                if i % 100000 == 0: printr("working with RE %d" % (i + 1))
                i += 1
                re = json.loads(line)
                re["accession"] = unicode(re["accession"])
                re["peak_intersections"] = tf_imap[re["accession"]] if re["accession"] in tf_imap else {"tf": {}, "histone": {}, "dnase": {}}
                o.write(json.dumps(re) + "\n")

def file_json(exp, bed):
    return {"accession": bed.fileID,
            "dataset_accession": exp.encodeID,
            "biosample_term_name": exp.biosample_term_name,
            "assay_term_name": exp.assay_term_name,
            "target": exp.target,
            "label": exp.label }

def do_intersection(bed, refnp):
    retval = []
    try:
        intersection = Utils.runCmds(["bedtools", "intersect",
                                      "-b", bed.fnp(),
                                      "-a", refnp,
                                      "-wa"])
    except:
        return None
    for line in intersection:
        line = line.strip()
        acc = str(line.split("\t")[3])
        retval.append(acc)
    return retval

def get_parallel_jobs(args, assembly):

    jobs = []
    i = 0

    if "mm10" == assembly:
        m = MetadataWS(Datasets.all_mouse)
    else:
        m = MetadataWS(Datasets.all_human)

    for exps, etype in [(m.chipseq_tfs_useful(assembly, args), "tf"),
                        (m.chipseq_histones_useful(assembly, args), "histone"),
                        (m.dnases_useful(assembly, args), "dnase")]:
        for exp in exps:
            i += 1
            try:
                beds = exp.bedFilters()
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

def run(jobargs, bedfnp):
    results = []
    exp = jobargs["exp"]
    bed = jobargs["bed"]
    retval = file_json(exp, bed)
    label = exp.label if jobargs["map"] != "dnase" else "dnase"
    if not os.path.exists(bed.fnp()):
        print("warning: missing bed %s; cannot intersect" % bed.fnp())
        return (retval, None)
    if "hg19" == jobargs["assembly"]:
        printr("intersecting TF %s (exp %d of %d)" % (label, jobargs["i"], jobargs["total"]))
        result = do_intersection(bed, bedfnp)
        if result is None:
            print("warning: unable to intersect REs with bed %s" % bed.fnp())
        else:
            results.append((jobargs["map"], label, bed.fileID, result))
    return (retval, results)

def assembly_json(args, assembly, in_fnps, bedfnp):
    tf_imap = {}
    files = []
    jobs = get_parallel_jobs(args, assembly)
    results = Parallel(n_jobs = args.j)(delayed(run)(_args, bedfnp) for _args in jobs)
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
    Parallel(n_jobs = args.j)(delayed(update_lsj)(infnp, tf_imap) for infnp in in_fnps)
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

    files = []
    args = parse_args()
    fnps = paths.get_paths(args.version, chroms[args.assembly])
    in_fnps = fnps["rewriteFnp"]
    bed_fnp = fnps["re_bed"]
    print(bed_fnp)

    if not os.path.exists(bed_fnp) or args.remake_bed:
        printt("generating RE bed file")
        with open(bed_fnp, "wb") as o:
            pass # truncate existing file
        for infnp in in_fnps:
            if not os.path.exists(infnp): continue
            lsj_to_beds(infnp, bed_fnp)
        print("\n")

    printt("intersecting TFs")
    files += assembly_json(args, args.assembly, in_fnps, bed_fnp)
    with open(os.path.join(Dirs.encyclopedia, "Version-4", "beds.lsj"), "wb") as o:
        for _file in files:
            o.write(json.dumps(_file) + "\n")
    print("\n")
    printt("wrote %s" % os.path.join(Dirs.encyclopedia, "Version-4", "beds.lsj"))
    return 0

if __name__ == '__main__':
    sys.exit(main())

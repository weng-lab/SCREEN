#!/usr/bin/env python

import os, sys
import json
import psycopg2
import argparse
import fileinput, StringIO
import gzip

from joblib import Parallel, delayed

sys.path.append("../../common")
from constants import paths
from common import printr, printt

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils, printWroteNumLines
from metadataws import MetadataWS
from files_and_paths import Datasets, Dirs

def as_bed(el):
    return "\t".join([el["position"]["chrom"],
                      str(el["position"]["start"]),
                      str(el["position"]["end"]),
                      el["accession"]])

def lsj_to_beds():
    infnp = paths.re_json_orig
    outfnp = paths.re_bed
    output = []

    i = 0
    
    with gzip.open(infnp, "r") as f:
        for line in f:
            el = json.loads(line.strip())
            output.append(as_bed(el))
            i += 1
            if i % 100000 == 0: printr("working with regelm %d" % i)

    with gzip.open(outfnp, "wb") as o:
        for el in output:
            o.write(el + "\n")

def update_lsj(_tf_imap):
    i = 0
    with gzip.open(paths.re_json_orig, "r") as f:
        with gzip.open(paths.re_json_orig + ".tmp", "wb") as o:
            for line in f:
                if i % 100000 == 0: printr("working with RE %d" % (i + 1))
                i += 1
                re = json.loads(line)
                for key, tf_imap in _tf_imap.iteritems():
                    print(key + " " + re["accession"])
                    if re["accession"] not in tf_imap: tf_imap[re["accession"]] = {}
                    re[key + "_intersection"] = tf_imap[re["accession"]]
                o.write(json.dumps(re) + "\n")
    os.replace(paths.re_json_orig + ".tmp", paths.re_json_orig)

def file_json(exp, bed):
    return {"accession": bed.fileID,
            "dataset_accession": exp.encodeID,
            "biosample_term_name": exp.biosample_term_name,
            "assay_term_name": exp.assay_term_name,
            "target": exp.target,
            "label": exp.label }

def do_intersection(bed, label, cmap):
    try:
        intersection = Utils.runCmds(["bedtools", "intersect",
                                      "-b", bed.fnp(),
                                      "-a", paths.re_bed,
                                      "-wa"])
    except:
        return False
    for line in intersection:
        line = line.strip()
        acc = line.split("\t")[3]
        if acc not in cmap: cmap[acc] = {}
        if label not in cmap[acc]: cmap[acc][label] = []
        cmap[acc][label].append(bed.fileID)
    return True

def get_parallel_jobs(args, assembly):

    jobs = []
    i = 0
    
    if "mm10" == assembly:
        m = MetadataWS(Datasets.all_mouse)
    else:
        m = MetadataWS(Datasets.all_human)

    for exps, etype in [(m.chipseq_tfs_useful(args), "TF"),
                        (m.chipseq_histones_useful(args), "histone"),
                        (m.dnases_useful(args), "DNase")]:
        for exp in exps:
            i += 1
            try:
                beds = exp.bedFilters()
                if not beds: print "missing", exp
                for bed in beds:
                    if assembly != bed.assembly: continue
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

def run(jobargs, tf_imap):
    exp = jobargs["exp"]
    bed = jobargs["bed"]
    retval = file_json(exp, bed)
    label = exp.label if jobargs["map"] != "dnase" else "dnase"
    if not os.path.exists(bed.fnp()):
        print("warning: missing bed %s; cannot intersect" % bed.fnp())
        return retval
    if "hg19" == jobargs["assembly"]:
        printr("intersecting TF %s (exp %d of %d)" % (label, jobargs["i"], jobargs["total"]))
        if not do_intersection(bed, label, tf_imap[jobargs["map"]]):
            print("warning: unable to intersect REs with bed %s" % bed.fnp())
    return retval

def assembly_json(args, assembly):
    tf_imap = {"tf": {},
               "histone": {},
               "dnase": {} }
    jobs = get_parallel_jobs(args, assembly)
    files = Parallel(n_jobs = args.j)(delayed(run)(_args, tf_imap) for _args in jobs)
    printt("\n\nupdating RE JSON")
    update_lsj(tf_imap)
    return files

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--process', action="store_true", default=True)
    parser.add_argument('-j', type=int, default=1)
    parser.add_argument('--remake_bed', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():

    files = []
    args = parse_args()

    if not os.path.exists(paths.re_bed) or args.remake_bed:
        printt("generating RE bed file")
        lsj_to_beds()
        print("\n")
    
    printt("intersecting TFs")
    for assembly in ["hg19", "mm10"]:
        files += assembly_json(args, assembly)
    with open(os.path.join(Dirs.encyclopedia, "Version-4", "beds.lsj"), "wb") as o:
        for _file in files:
            o.write(json.dumps(_file) + "\n")
    printt("\n\nwrote %s" % os.path.join(Dirs.encyclopedia, "Version-4", "beds.lsj"))
    return 0

if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python

import os, sys, json, psycopg2, argparse, fileinput, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils, printWroteNumLines
from metadataws import MetadataWS
from files_and_paths import Datasets, Dirs

def file_json(exp, bed):
    return {"accession": bed.fileID,
            "dataset_accession": exp.encodeID,
            "biosample_term_name": exp.biosample_term_name,
            "assay_term_name": exp.assay_term_name,
            "target": exp.target,
            "label": exp.label }

def assembly_json(args, assembly):

    files = []
    
    if "mm10" == assembly:
        m = MetadataWS(Datasets.all_mouse)
    else:
        m = MetadataWS(Datasets.all_human)

    for exps in [m.chipseq_tfs_useful(args),
                 m.chipseq_histones_useful(args),
                 m.dnases_useful(args)]:
        for exp in exps:
            try:
                beds = exp.bedFilters()
                if not beds: print "missing", exp
                for bed in beds:
                    if assembly != bed.assembly: continue
                    files.append(file_json(exp, bed))
            except Exception, e:
                print str(e)
                print "bad exp:", exp

    return files

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--process', action="store_true", default=True)
    args = parser.parse_args()
    return args

def main():
    files = []
    args = parse_args()
    for assembly in ["hg19", "mm10"]:
        files += assembly_json(args, assembly)
    with open(os.path.join(Dirs.encyclopedia, "Version-4", "beds.lsj"), "wb") as o:
        for _file in files:
            o.write(json.dumps(_file) + "\n")
    print("wrote %s" % os.path.join(Dirs.encyclopedia, "Version-4", "beds.lsj"))
    return 0

if __name__ == '__main__':
    sys.exit(main())

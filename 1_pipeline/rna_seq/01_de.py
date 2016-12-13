#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from exp import Exp
from utils import Utils
from metadataws import MetadataWS


def get_expids(curs):
    curs.execute("SELECT encode_id FROM r_rnas")
    return curs.fetchall()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="hg19")
    args = parser.parse_args()
    return args

"""
  " converts a list of gene quantification TSVs from ENCODE into a TSV which DESeq can read.
  " in_fnps: array of paths to the ENCODE TSVs
  " out_fnp: path to output the TSV
"""
def create_tsv(in_fnps, out_fnp):
    genes = {}

    # for each TSV
    for _file in in_fnps:
        c = 0 # for skipping first line

        # double check it exists
        if not os.path.exists(_file):
            print("warning: missing file %s; skipping" % _file)

        # open file, skip first line
        with open(_file, "r") as f:
            for line in f:
                if c == 0:
                    c = 1
                    continue

                # gene ID in column 1, FPKM in column 7
                p = line.split("\t")
                if p[0] not in genes: genes[p[0]] = {}
                genes[p[0]][_file] = p[6] # FPKM

    # open output file
    with open(out_fnp, "wb") as o:

        # write header
        o.write("gene\t" + "\t".join([os.path.basename(x).replace(".tsv", "") for x in in_fnps]) + "\n")

        # write genes
        for k, v in genes.iteritems():
            o.write(k.replace(".", "_"))
            for _file in in_fnps:
                o.write("\t" + str(int(float(v[_file]) * 1000)) if _file in v else "0")
            o.write("\n")

"""
  " generates metadata for DESeq and saves it to the given output path.
  " e1, e2: Exp objects referring to ENCODE RNA-Seq experiments
  " assembly: assmelby for which to select TSVs
  " out_fnp: path to save the metadata
  "
  " returns: list of paths to TSV files included in the metadata
"""
def generate_metadata(e1, e2, assembly, out_fnp):
    
    metadata = {}
    retval = []

    for e in [e1, e2]:
        
        # determine whether replicates are paired-end or single-end
        reps = {}
        for fastq in filter(lambda f: f.file_type == "fastq", e.files):
            for replicate in fastq.biological_replicates:
                reps[replicate] = "paired-end" if "paired" in fastq.jsondata["run_type"] else "single-end"

        # get metadata for all TSVs
        for tsv in filter(lambda f: f.file_type == "tsv" and f.output_type == "gene quantifications" and f.assembly == assembly, e.files):
            metadata[os.path.basename(tsv.fnp())] = "\t".join([e.biosample_term_name, reps[tsv.biological_replicates[0]]])
            retval.append(tsv.fnp())
            if not os.path.exists(tsv.fnp()): tsv.download()

    # open output file, write header and entries
    with open(out_fnp, "wb") as o:
        o.write("key\tcondition\tlibType\n")
        for k, v in metadata.iteritems():
            o.write(k.replace(".tsv", "") + "\t" + v + "\n")

    # return path list
    return retval

def main():
    args = parse_args()

    for dataset in [Datasets.all_human]:

        # get datasets from database
        DBCONN = db_connect(os.path.realpath(__file__), args.local)
        with getcursor(DBCONN, "06_de") as curs:
            expids = get_expids(curs)
        exps = [Exp.fromJsonFile(i[0]) for i in expids]
            
        # produce input and metadata for each pair
        for i in xrange(len(exps)):
            for j in range(i + 1, len(exps)):
                e1 = exps[i]
                e2 = exps[j]
                
                # check output directory exists
                dnp = "/project/umw_zhiping_weng/0_metadata/encyclopedia/de/%s_%s/" % (e1.encodeID, e2.encodeID)
                if not os.path.exists(dnp):
                    os.makedirs(dnp)
                    
                # produce data and metadata files
                inputfnp = os.path.join(dnp, "data.tsv")
                mfnp = os.path.join(dnp, "metadata.tsv")
                print("generating metadata for pair %s/%s" % (e1.encodeID, e2.encodeID))
                flist = generate_metadata(e1, e2, args.assembly, mfnp)
                create_tsv(flist, inputfnp)
                print("input at %s" % inputfnp)
                print("metadata at %s" % mfnp)

    return 0

if __name__ == '__main__':
    sys.exit(main())

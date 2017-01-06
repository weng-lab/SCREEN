#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils

def setupTable(curs, tableName):
    print("rebuilding", tableName, "...")
    curs.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName} 
    (id serial PRIMARY KEY,
    accession VARCHAR(20),
    mpName text,
    negLogP real,
    chrom VARCHAR(7),
    start integer,
    stop integer,
    conservation_rank integer[],
    conservation_signal real[],
    dnase_rank integer[],
    dnase_signal real[],
    dnase_zscore real[],
    ctcf_only_rank integer[],
    ctcf_only_zscore real[],
    ctcf_dnase_rank integer[],
    ctcf_dnase_zscore real[],
    h3k27ac_only_rank integer[],
    h3k27ac_only_zscore real[],
    h3k27ac_dnase_rank integer[],
    h3k27ac_dnase_zscore real[],
    h3k4me3_only_rank integer[],
    h3k4me3_only_zscore real[],
    h3k4me3_dnase_rank integer[],
    h3k4me3_dnase_zscore real[]
    ); """.format(tableName = tableName))
    print("rebuilt", tableName)
    
def importTsv(curs, tableName, fnp):    
    cols = ("accession", "mpName", "negLogP",
            "chrom", "start", "stop",
	    "conservation_rank", "conservation_signal",
	    "dnase_rank", "dnase_signal", "dnase_zscore",
	    "ctcf_only_rank", "ctcf_only_zscore",
	    "ctcf_dnase_rank", "ctcf_dnase_zscore",
	    "h3k27ac_only_rank", "h3k27ac_only_zscore",
	    "h3k27ac_dnase_rank", "h3k27ac_dnase_zscore",
	    "h3k4me3_only_rank", "h3k4me3_only_zscore",
	    "h3k4me3_dnase_rank", "h3k4me3_dnase_zscore")
    
    with open(fnp) as f:
        print("importing", tableName, fnp)
        curs.copy_from(f, tableName, '\t', columns=cols)
    print("imported", fnp)

def doIndex(curs, tableName):
    cols = ("conservation_rank", "conservation_signal",
	    "dnase_rank", "dnase_signal", "dnase_zscore",
	    "ctcf_only_rank", "ctcf_only_zscore",
	    "ctcf_dnase_rank", "ctcf_dnase_zscore",
	    "h3k27ac_only_rank", "h3k27ac_only_zscore",
	    "h3k27ac_dnase_rank", "h3k27ac_dnase_zscore",
	    "h3k4me3_only_rank", "h3k4me3_only_zscore",
	    "h3k4me3_dnase_rank", "h3k4me3_dnase_zscore")
    for col in cols:
        idx = col + "_idx"
        print("indexing", col)
        curs.execute("""
CREATE INDEX {idx} on {tableName} USING GIN ({col});
""".format(idx = idx, tableName = tableName, col = col))

def doIndexGin(curs, tableName):
    cols = ("conservation_rank", "conservation_signal",
	    "dnase_rank", "dnase_signal", "dnase_zscore",
	    "ctcf_only_rank", "ctcf_only_zscore",
	    "ctcf_dnase_rank", "ctcf_dnase_zscore",
	    "h3k27ac_only_rank", "h3k27ac_only_zscore",
	    "h3k27ac_dnase_rank", "h3k27ac_dnase_zscore",
	    "h3k4me3_only_rank", "h3k4me3_only_zscore",
	    "h3k4me3_dnase_rank", "h3k4me3_dnase_zscore")
    for col in cols:
        idx = col + "_idx"
        print("indexing", col)
        curs.execute("""
CREATE INDEX {idx} on {tableName} USING GIN ({col});
""".format(idx = idx, tableName = tableName, col = col))

def doSetup(curs, tableName, d):
    setupTable(curs, tableName)

    chrs = ["chr01", "chr02", "chr03", "chr04", "chr05",
            "chr06", "chr07", "chr08", "chr09", "chr10", "chr11", "chr12",
            "chr13", "chr14", "chr15", "chr16", "chr17", "chr18", "chr19",
            "chrX", "chrY"]

    for chrom in chrs:
        fnp = os.path.join(d, "parsed." + chrom + ".tsv")
        importTsv(curs, tableName, fnp)
    print("about to analyze", tableName)
    curs.execute("analyze " + tableName)
    print("done")
    
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--setup', action="store_true", default=False)
    parser.add_argument('--index', action="store_true", default=False)
    parser.add_argument('--indexGin', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    d = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver8/mm10/newway/"

    with getcursor(DBCONN, "08_setup_log") as curs:
        tableName = "mm10_cre"

        if args.setup:
            doSetup(curs, tableName, d)
        elif args.index:
            doIndex(curs, tableName, d)
        elif args.indexGin:
            # doIndexGin(curs, tableName, d)
            pass
        else:
            doSetup(curs, tableName, d)
            #doIndexGin(curs, tableName, d)
               
if __name__ == '__main__':
    main()

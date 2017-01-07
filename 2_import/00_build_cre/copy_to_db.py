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
    print("dropping and creating", tableName, "...")
    curs.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName} 
    (id serial PRIMARY KEY,
    accession VARCHAR(20),
    mpName text,
    negLogP real,
    chrom VARCHAR(5),
    start integer,
    stop integer,
    conservation_rank integer[],
    conservation_signal numeric(8,3)[],
    dnase_rank integer[],
    dnase_signal numeric(8,3)[],
    dnase_zscore numeric(8,3)[],
    ctcf_only_rank integer[],
    ctcf_only_zscore numeric(8,3)[],
    ctcf_dnase_rank integer[],
    ctcf_dnase_zscore numeric(8,3)[],
    h3k27ac_only_rank integer[],
    h3k27ac_only_zscore numeric(8,3)[],
    h3k27ac_dnase_rank integer[],
    h3k27ac_dnase_zscore numeric(8,3)[],
    h3k4me3_only_rank integer[],
    h3k4me3_only_zscore numeric(8,3)[],
    h3k4me3_dnase_rank integer[],
    h3k4me3_dnase_zscore numeric(8,3)[]
    ); """.format(tableName = tableName))
    #print("created", tableName)

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
        print("importing", fnp, "into", tableName)
        curs.copy_from(f, tableName, '\t', columns=cols)
    #print("imported", os.path.basename(fnp))

def doIndex(curs, tableName):
    cols = ("accession", "chrom", "start", "stop",)
    for col in cols:
        idx = col + "_idx"
        print("indexing", tableName, col)
        curs.execute("""
DROP INDEX IF EXISTS {idx};
CREATE INDEX {idx} on {tableName} ({col});
""".format(idx = idx, tableName = tableName, col = col))

    cols = ("neglogp",)
    for col in cols:
        idx = tableName + '_' + col + "_idx"
        print("indexing", tableName, col, "DESC")
        curs.execute("""
DROP INDEX IF EXISTS {idx};
CREATE INDEX {idx} on {tableName} ({col} DESC);
""".format(idx = idx, tableName = tableName, col = col))

def setupRangeFunction(curs):
    print("create range function...")
    curs.execute("""
create or replace function intarray2int4range(arr int[]) returns int4range as $$
    select int4range(min(val), max(val) + 1) from unnest(arr) as val;
$$ language sql immutable;

create or replace function numarray2numrange(arr numeric[]) returns numrange as $$
    select numrange(min(val), max(val) + 1) from unnest(arr) as val;
$$ language sql immutable;
""")
           
def setupIndicies(curs, tableName, chrs):
    setupRangeFunction(curs)
    doIndexRange(curs, tableName)
    doIndex(curs, tableName)
    
    for chrom in chrs:
        chromTableName = tableName + '_' + chrom
        doIndex(curs, chromTableName)
        doIndexRange(curs, chromTableName)
        
def doIndexRange(curs, tableName):
    cols = ("conservation_rank", 
	    "dnase_rank", 
	    "ctcf_only_rank",
	    "ctcf_dnase_rank",
	    "h3k27ac_only_rank",
	    "h3k27ac_dnase_rank",
	    "h3k4me3_only_rank",
	    "h3k4me3_dnase_rank")
    for col in cols:
        idx = tableName + '_' + col + "_idx"
        print("indexing int range", col)
        curs.execute("""
DROP INDEX IF EXISTS {idx};
create index {idx} on {tableName} using gist(intarray2int4range({col}));
""".format(idx = idx, tableName = tableName, col = col))

    cols = ("conservation_signal",
	    "dnase_signal", "dnase_zscore",
	    "ctcf_only_zscore",
	    "ctcf_dnase_zscore",
	    "h3k27ac_only_zscore",
	    "h3k27ac_dnase_zscore",
	    "h3k4me3_only_zscore",
	    "h3k4me3_dnase_zscore")
    for col in cols:
        idx = tableName + '_' + col + "_idx"
        print("indexing numeric range", col)
        curs.execute("""
DROP INDEX IF EXISTS {idx};
create index {idx} on {tableName} using gist(numarray2numrange({col}));
""".format(idx = idx, tableName = tableName, col = col))

def doSetup(curs, tableName, d, chrs):
    setupTable(curs, tableName)

    for chrom in chrs:
        fnp = os.path.join(d, "parsed." + chrom + ".tsv")
        importTsv(curs, tableName, fnp)
        chromTableName = tableName + '_' + chrom
        setupTable(curs, chromTableName)
        importTsv(curs, chromTableName, fnp)

    print("about to vacuum analyze", tableName)
    curs.execute("vacuum analyze " + tableName)
    for chrom in chrs:
        chromTableName = tableName + '_' + chrom
        print("about to vacuum analyze", chromTableName)
        curs.execute("vacuum analyze " + chromTableName)
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

    mm10_chrs = ["chr1", "chr2", "chr3", "chr4", "chr5",
                 "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12",
                 "chr13", "chr14", "chr15", "chr16", "chr17", "chr18", "chr19",
                 "chrX", "chrY"]

    chrs = mm10_chrs
    
    with getcursor(DBCONN, "08_setup_log") as curs:
        tableName = "mm10_cre"

        if args.setup:
            doSetup(curs, tableName, d, chrs)
        elif args.index:
            setupIndicies(curs, tableName, chrs)
        else:
            doSetup(curs, tableName, d, chrs)
            setupIndicies(curs, tableName, chrs)
               
if __name__ == '__main__':
    main()

#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt
from db_utils import getcursor, vacumnAnalyze, makeIndex
from files_and_paths import Dirs, Tools, Genome, Datasets

AddPath(__file__, '../common/')
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS

def makeTable(curs, m):
    tableName = m["tableName"]
    
    curs.execute("""
DROP TABLE IF EXISTS {tn} CASCADE;

CREATE TABLE {tn}
 (
 id serial PRIMARY KEY,
 accession VARCHAR(20),
 rDHS VARCHAR(20),
 chrom VARCHAR(5),
 start integer,
 stop integer,
 creGroup integer
 isProximal boolean,

 conservation_signals real[],
 conservation_max real,
 ctcf_zscores real[],
 ctcf_max real,
 dnase_zscores real[],
 dnase_max real,
 enhancer_zscores real[],
 enhancer_max real,
 h3k27ac_zscores real[],
 h3k27ac_max real,
 h3k4me3_zscores real[],
 h3k4me3_max real,
 insulator_zscores real[],
 insulator_max real,
 promoter_zscores real[],
 promoter_max real,
 maxz real,

 gene_all_distance integer[],
 gene_all_id integer[],
 gene_pc_distance integer[],
 gene_pc_id integer[],

 tads integer[],
); """.format(tn = tableName))

def doImport(curs, m):
    tableName = m["tableName"]
    d = m["d"]
    subsample = m["subsample"]
    for chrom in chroms:
        fn = "parsed." + chrom + ".tsv.gz"
        fnp = os.path.join(d, fn)
        if subsample:
            if "chr13" != chrom:
                fnp = os.path.join(d, "sample", fn)
        cols = DB_COLS
        with gzip.open(fnp) as f:
            printt("importing", fnp, "into", ctn)
            curs.copy_from(f, tableName, '\t', columns=cols)

def selectInto(curs, m):
    tn = m["tableName"]
    ntn = m["tableName_all"]

    curs.execute("""
    DROP TABLE IF EXISTS {ntn} CASCADE;

    SELECT * 
    INTO {ntn}
    FROM {tn}
    ORDER BY maxZ, chrom, start;

    DROP TABLE {tn};
    """.format(tn = tn, ntn = ntn))
    
def addCol(curs, assembly):
    printt("adding col...")
    curs.execute("""
ALTER TABLE {tn}
ADD COLUMN creGroup integer;

UPDATE {tn}
SET ...
""".format(tn = assembly + "_cre"))

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--sample', action="store_true", default=False)
    args = parser.parse_args()
    return args

def makeInfo(assembly, sample):
    return {"chrs" : chroms[assembly],
            "assembly" : assembly,
            "d" : paths.fnpCreTsvs(assembly),
            "base" : paths.path(assembly),
            "tableName" : assembly + "_cre",
            "tableName_all" : assembly + "_cre_all",
            "subsample": sample}

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        m = makeInfo(assembly, args.sample)

        if 1:
            with getcursor(DBCONN, "dropTables") as curs:
                print('***********', "drop tables")
                makeTable(curs, m)
                
                print('***********', "create tables")
                doImport(curs, m)

                print('***********', "selecting into", ntn)
                selectInto(curs, m)
                
        else:
            # example to show how to add and populate column to
            #  master and, by inheritance, children tables...
            with getcursor(DBCONN, "01_regelms") as curs:
                addCol(curs, assembly)

        print('***********', "vacumn")
        vacumnAnalyze(DBCONN.getconn(), m["tableName"], m["chrs"])

    return 0

if __name__ == '__main__':
    main()

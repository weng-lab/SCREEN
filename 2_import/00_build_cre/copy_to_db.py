#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils

class ImportData:
    def __init__(self, curs, chrs, baseTableName, cols):
        self.curs = curs
        self.chrs = chrs
        self.baseTableName = baseTableName
        self.all_cols = cols
        
    def setupTable(self, tableName):
        print("dropping and creating", tableName, "...")
        self.curs.execute("""
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

    def importTsv(self, tn, fnp):    
        cols = self.all_cols
        with open(fnp) as f:
            print("importing", fnp, "into", tn)
            self.curs.copy_from(f, tn, '\t', columns=cols)
        #print("imported", os.path.basename(fnp))

    def run(self, d):
        self.setupTable(self.baseTableName)

        for chrom in self.chrs:
            fnp = os.path.join(d, "parsed." + chrom + ".tsv")
            ctn = self.baseTableName + '_' + chrom
            self.setupTable(ctn)
            self.importTsv(self.baseTableName, fnp)
            self.importTsv(ctn, fnp)

class CreateIndices:
    def __init__(self, curs, chrs, baseTableName, cols):
        self.curs = curs
        self.chrs = chrs
        self.baseTableName = baseTableName
        self.all_cols = cols
        self.rank_cols = [x for x in cols if x.endswith("_rank")]
        self.signal_cols = [x for x in cols if x.endswith("_signal")]
        self.zscore_cols = [x for x in cols if x.endswith("_zscore")]
    
    def doIndex(self, tableName):
        cols = ("accession", "chrom", "start", "stop",)
        for col in cols:
            idx = col + "_idx"
            print("indexing", tableName, col)
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    CREATE INDEX {idx} on {tableName} ({col});
    """.format(idx = idx, tableName = tableName, col = col))

        cols = ("neglogp",)
        for col in cols:
            idx = tableName + '_' + col + "_idx"
            print("indexing", tableName, col, "DESC")
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    CREATE INDEX {idx} on {tableName} ({col} DESC);
    """.format(idx = idx, tableName = tableName, col = col))

    def setupRangeFunction(self):
        print("create range function...")
        self.curs.execute("""
    create or replace function intarray2int4range(arr int[]) returns int4range as $$
        select int4range(min(val), max(val) + 1) from unnest(arr) as val;
    $$ language sql immutable;

    create or replace function numarray2numrange(arr numeric[]) returns numrange as $$
        select numrange(min(val), max(val) + 1) from unnest(arr) as val;
    $$ language sql immutable;
    """)

    def run(self):
        self.setupRangeFunction()
        self.doIndexRange(self.baseTableName)
        self.doIndex(self.baseTableName)

        for chrom in self.chrs:
            ctn = self.baseTableName + '_' + chrom
            self.doIndex(ctn)
            self.doIndexRange(ctn)

    def doIndexRange(self, tableName):
        cols = self.rank_cols
        for col in cols:
            idx = tableName + '_' + col + "_idx"
            print("indexing int range", col)
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    create index {idx} on {tableName} using gist(intarray2int4range({col}));
    """.format(idx = idx, tableName = tableName, col = col))

        cols = self.signal_cols + self.zscore_cols
        for col in cols:
            idx = tableName + '_' + col + "_idx"
            print("indexing numeric range", col)
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    create index {idx} on {tableName} using gist(numarray2numrange({col}));
    """.format(idx = idx, tableName = tableName, col = col))

    def vacumnAnalyze(self, conn):
        # http://stackoverflow.com/a/1017655
        print("about to vacuum analyze", self.baseTableName)
        old_isolation_level = conn.isolation_level
        conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
        curs = conn.cursor()
        curs.execute("vacuum analyze " + self.baseTableName)
        for chrom in self.chrs:
            ctn = self.baseTableName + '_' + chrom
            print("about to vacuum analyze", ctn)
            curs.execute("vacuum analyze " + ctn)
        conn.set_isolation_level(old_isolation_level)
        print("done")

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--setup', action="store_true", default=False)
    parser.add_argument('--index', action="store_true", default=False)
    parser.add_argument('--vac', action="store_true", default=False)
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

    cols = ("accession", "mpName", "negLogP", "chrom", "start", "stop",
            "conservation_rank", "conservation_signal",
 	    "dnase_rank", "dnase_signal", "dnase_zscore",
	    "ctcf_only_rank", "ctcf_only_zscore",
 	    "ctcf_dnase_rank", "ctcf_dnase_zscore",
 	    "h3k27ac_only_rank", "h3k27ac_only_zscore",
 	    "h3k27ac_dnase_rank", "h3k27ac_dnase_zscore",
 	    "h3k4me3_only_rank", "h3k4me3_only_zscore",
 	    "h3k4me3_dnase_rank", "h3k4me3_dnase_zscore")

    chrs = mm10_chrs
    
    with getcursor(DBCONN, "08_setup_log") as curs:
        tableName = "mm10_cre"

        im = ImportData(curs, chrs, tableName, cols)
        ci = CreateIndices(curs, chrs, tableName, cols)
            
        if args.setup:
            im.run(d)
        elif args.index:
            ci.run()
        elif args.vac:
            ci.vacumnAnalyze(DBCONN.getconn())
        else:
            im.run(d)
            ci.run()
               
if __name__ == '__main__':
    main()

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
    def __init__(self, curs, info, cols):
        self.curs = curs
        self.chrs = info["chrs"]
        self.baseTableName = info["tableName"]
        self.d = info["d"]
        self.base = info["base"]
        self.all_cols = cols
        self.assembly = info["assembly"]

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
        h3k4me3_dnase_zscore numeric(8,3)[],
        gene_all_distance integer[],
        gene_all_id integer[],
        gene_pc_distance integer[],
        gene_pc_id integer[],
        tads integer[]
        ); """.format(tableName = tableName))
        print("created", tableName)

    def importTsv(self, tn, fnp):
        cols = self.all_cols
        with open(fnp) as f:
            print("importing", fnp, "into", tn)
            self.curs.copy_from(f, tn, '\t', columns=cols)
        #print("imported", os.path.basename(fnp))

    def setupGeneToID(self):
        tableName = self.assembly + "_gene_info"
        print("dropping and creating", tableName, "...")
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
    CREATE TABLE {tableName}
        (id serial PRIMARY KEY,
        ensembl_ver text,
        ensembl text,
        geneid integer
        ); """.format(tableName = tableName))
        print("created", tableName)

        cols = ["ensembl_ver", "ensembl", "geneid"]
        fnp = os.path.join(self.base, "raw", "ensebleToID.txt")
        with open(fnp) as f:
            print("importing", fnp, "into", tableName)
            self.curs.copy_from(f, tableName, ',', columns=cols)

    def run(self):
        self.setupGeneToID()
        self.setupTable(self.baseTableName)

        for chrom in self.chrs:
            fnp = os.path.join(self.d, "parsed." + chrom + ".tsv")
            ctn = self.baseTableName + '_' + chrom
            self.setupTable(ctn)
            self.importTsv(self.baseTableName, fnp)
            self.importTsv(ctn, fnp)

class CreateIndices:
    def __init__(self, curs, info, cols):
        self.curs = curs
        self.chrs = info["chrs"]
        self.baseTableName = info["tableName"]
        self.d = info["d"]
        self.all_cols = cols
        self.rank_cols = [x for x in cols if x.endswith("_rank")]
        self.signal_cols = [x for x in cols if x.endswith("_signal")]
        self.zscore_cols = [x for x in cols if x.endswith("_zscore")]

    def _idx(self, tn, col, suf = ""):
        if suf:
            return tn + '_' + col + '_' + suf + "_idx"
        return tn + '_' + col + "_idx"

    def doIndex(self, tableName):
        cols = ("accession", "chrom", "start", "stop",)
        for col in cols:
            idx = self._idx(tableName, col)
            print("indexing", idx)
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    CREATE INDEX {idx} on {tableName} ({col});
    """.format(idx = idx, tableName = tableName, col = col))

        cols = ("neglogp",)
        for col in cols:
            idx = self._idx(tableName, col)
            print("indexing", idx, "DESC")
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    CREATE INDEX {idx} on {tableName} ({col} DESC);
    """.format(idx = idx, tableName = tableName, col = col))

    def doIndexGin(self, tableName): # best for '<@' operator on element of array
        cols = self.rank_cols + self.signal_cols + self.zscore_cols
        for col in cols:
            idx = self._idx(tableName, col, "gin")
            print("indexing", idx)
            self.curs.execute("""
    CREATE INDEX {idx} on {tableName} USING GIN ({col});
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
        self.doIndex(self.baseTableName)
        self.doIndexGin(self.baseTableName)
        self.doIndexRange(self.baseTableName)

        for chrom in self.chrs:
            ctn = self.baseTableName + '_' + chrom
            self.doIndex(ctn)
            self.doIndexGin(ctn)
            self.doIndexRange(ctn)

    def doIndexRange(self, tableName):
        cols = self.rank_cols
        for col in cols:
            idx = self._idx(tableName, col)
            print("indexing int range", idx)
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    create index {idx} on {tableName} using gist(intarray2int4range({col}));
    """.format(idx = idx, tableName = tableName, col = col))

        cols = self.signal_cols + self.zscore_cols
        for col in cols:
            idx = self._idx(tableName, col)
            print("indexing numeric range", idx)
            self.curs.execute("""
    DROP INDEX IF EXISTS {idx};
    create index {idx} on {tableName} using gist(numarray2numrange({col}));
    """.format(idx = idx, tableName = tableName, col = col))

def vacumnAnalyze(conn, baseTableName, chrs):
    # http://stackoverflow.com/a/1017655
    print("about to vacuum analyze", baseTableName)
    old_isolation_level = conn.isolation_level
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    curs = conn.cursor()
    curs.execute("vacuum analyze " + baseTableName)
    for chrom in chrs:
        ctn = baseTableName + '_' + chrom
        print("about to vacuum analyze", ctn)
        curs.execute("vacuum verbose analyze " + ctn)
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

mm10Info = {"chrs" : ["chr1", "chr2", "chr3", "chr4", "chr5",
                      "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12",
                      "chr13", "chr14", "chr15", "chr16", "chr17", "chr18",
                      "chr19", "chrX", "chrY"],
            "assembly" : "mm10",
            "d" : "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver8/mm10/newway/",
            "base" : "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/mm10/",
            "tableName" : "mm10_cre"}

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    cols = ("accession", "mpName", "negLogP", "chrom", "start", "stop",
            "conservation_rank", "conservation_signal",
 	    "dnase_rank", "dnase_signal", "dnase_zscore",
	    "ctcf_only_rank", "ctcf_only_zscore",
 	    "ctcf_dnase_rank", "ctcf_dnase_zscore",
 	    "h3k27ac_only_rank", "h3k27ac_only_zscore",
 	    "h3k27ac_dnase_rank", "h3k27ac_dnase_zscore",
 	    "h3k4me3_only_rank", "h3k4me3_only_zscore",
 	    "h3k4me3_dnase_rank", "h3k4me3_dnase_zscore",
            "gene_all_distance", "gene_all_name",
            "gene_pc_distance", "gene_pc_name", "tads")

    m = mm10Info

    with getcursor(DBCONN, "08_setup_log") as curs:
        im = ImportData(curs, m, cols)
        ci = CreateIndices(curs, m, cols)
        if args.setup:
            im.run()
        elif args.index:
            ci.run()
        elif args.vac:
            pass
        else:
            im.run()

    if args.setup or args.vac:
        vacumnAnalyze(DBCONN.getconn(), m["tableName"], m["chrs"])

    with getcursor(DBCONN, "08_setup_log") as curs:
        ci = CreateIndices(curs, m, cols)
        if not args.setup and not args.index and not args.vac:
            ci.run()

    return 0

if __name__ == '__main__':
    main()

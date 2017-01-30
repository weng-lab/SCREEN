#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer

class ImportData:
    def __init__(self, curs, info, cols):
        self.curs = curs
        self.chrs = info["chrs"]
        self.baseTableName = info["tableName"]
        self.d = info["d"]
        self.base = info["base"]
        self.all_cols = cols
        self.assembly = info["assembly"]
        self.subsample = info["subsample"]

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
        with gzip.open(fnp) as f:
            print("importing", fnp, "into", tn)
            self.curs.copy_from(f, tn, '\t', columns=cols)
        #print("imported", os.path.basename(fnp))

    def run(self, fullChrom):
        self.setupTable(self.baseTableName)

        for chrom in self.chrs:
            fn = "parsed." + chrom + ".tsv.gz"
            fnp = os.path.join(self.d, fn)
            if self.subsample and chrom != fullChrom:
                fnp = os.path.join(self.d, "sample", fn)
            ctn = self.baseTableName + '_' + chrom
            self.setupTable(ctn)
            self.importTsv(self.baseTableName, fnp)
            self.importTsv(ctn, fnp)

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
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument("--chrom", type=str, default="")
    parser.add_argument('--setup', action="store_true", default=False)
    parser.add_argument('--sample', action="store_true", default=False)
    parser.add_argument('--vac', action="store_true", default=False)
    args = parser.parse_args()
    return args

infos = {"mm10" : {"chrs" : ["chr1", "chr2", "chr3", "chr4", "chr5",
                             "chr6", "chr7", "chr8", "chr9", "chr10",
                             "chr11", "chr12",
                             "chr13", "chr14", "chr15", "chr16", "chr17", "chr18",
                             "chr19", "chrX", "chrY"],
                   "assembly" : "mm10",
                   "d" : "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/mm10/newway/",
                   "base" : "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/mm10/",
                   "tableName" : "mm10_cre"},
         "hg19" : {"chrs" : ["chr1", "chr2", "chr3", "chr4", "chr5",
                             "chr6", "chr7", "chr8", "chr9", "chr10", "chr11", "chr12",
                             "chr13", "chr14", "chr15", "chr16", "chr17", "chr18",
                             "chr19", 'chr20', 'chr21', 'chr22', "chrX", "chrY"],
                   "assembly" : "hg19",
                   "d" : "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/hg19/newway/",
                   "base" : "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/hg19/",
                   "tableName" : "hg19_cre"}}

def run(args, DBCONN):
    cols = ("accession", "mpName", "negLogP", "chrom", "start", "stop",
            "conservation_rank", "conservation_signal",
 	    "dnase_rank", "dnase_signal", "dnase_zscore",
	    "ctcf_only_rank", "ctcf_only_zscore",
 	    "ctcf_dnase_rank", "ctcf_dnase_zscore",
 	    "h3k27ac_only_rank", "h3k27ac_only_zscore",
 	    "h3k27ac_dnase_rank", "h3k27ac_dnase_zscore",
 	    "h3k4me3_only_rank", "h3k4me3_only_zscore",
 	    "h3k4me3_dnase_rank", "h3k4me3_dnase_zscore",
            "gene_all_distance", "gene_all_id",
            "gene_pc_distance", "gene_pc_id", "tads")

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        m = infos[assembly]
        m["subsample"] = args.sample

        if args.vac:
            vacumnAnalyze(DBCONN.getconn(), m["tableName"], m["chrs"])
            continue

        with getcursor(DBCONN, "08_setup_log") as curs:
            im = ImportData(curs, m, cols)
            im.run(args.chrom)
            
        vacumnAnalyze(DBCONN.getconn(), m["tableName"], m["chrs"])

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    run(args, DBCONN)

    return 0

if __name__ == '__main__':
    main()

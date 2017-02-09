#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexRange
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer

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

    def run(self):
        self.setupRangeFunction()
        for chrom in self.chrs:
            ctn = self.baseTableName + '_' + chrom
            makeIndex(self.curs, ctn, ("accession", "start", "stop"))
            makeIndexRev(self.curs, ctn, ["maxz"])

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

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="")
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

        with getcursor(DBCONN, "08_setup_log") as curs:
            ci = CreateIndices(curs, m, cols)
            ci.run()

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    run(args, DBCONN)

    return 0

if __name__ == '__main__':
    main()

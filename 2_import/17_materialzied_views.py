#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer, printt

def makeIdex(curs, cols, tableName):
    def _idx(tn, col, suf = ""):
        if suf:
            return tn + '_' + col + '_' + suf + "_idx"
        return tn + '_' + col + "_idx"
    for col in cols:
        idx = _idx(tableName, col)
        printt("indexing", idx)
        curs.execute("""
DROP INDEX IF EXISTS {idx};
CREATE INDEX {idx} on {tableName} ({col});
""".format(idx = idx, tableName = tableName, col = col))
        printt("\tok")

def importProxDistal(curs, assembly):
    d = os.path.join("/project/umw_zhiping_weng/0_metadata/encyclopedia/",
                     "Version-4", "ver9", assembly)
    fnp = os.path.join(d, assembly + "-Proximal-Distal.txt")
    printt("reading", fnp)
    with open(fnp) as f:
        rows = [line.rstrip().split('\t') for line in f]

    printt("rewriting")
    outF = StringIO.StringIO()
    for r in rows:
        row = r[0] + '\t' + ('1' if r[1] == "proximal" else '0') + '\n'
        outF.write(row)
    outF.seek(0)
    printt("\tok")

    tableName = assembly + "_isProximal"
    printt("copy into db...")

    curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}
(id serial PRIMARY KEY, 
accession text,
isProximal boolean
);""".format(tn = tableName))

    curs.copy_from(outF, tableName, '\t', columns=('accession', 'isProximal'))
    printt("\tok")

    makeIdex(curs, ["accession"], tableName)

"""
DROP MATERIALIZED VIEW  if exists mm10_cre_chr19_mv ;


CREATE MATERIALIZED VIEW mm10_cre_chr19_mv 
AS 
SELECT *, 
(select max(x) from unnest(dnase_zscore) x) as dnase_zscore_max,
(select max(x) from unnest(ctcf_only_zscore) x) as ctcf_only_zscore_max,
(select max(x) from unnest(ctcf_dnase_zscore) x) as ctcf_dnase_zscore_max, 
(select max(x) from unnest(h3k27ac_only_zscore) x) as h3k27ac_only_zscore_max, 
(select max(x) from unnest(h3k27ac_dnase_zscore) x) as h3k27ac_dnase_zscore_max, 
(select max(x) from unnest(h3k4me3_only_zscore) x) as h3k4me3_only_zscore_max, 
(select max(x) from unnest(h3k4me3_dnase_zscore) x) as h3k4me3_dnase_zscore_max

FROM mm10_cre_chr19


"""


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

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

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        m = infos[assembly]

        with getcursor(DBCONN, "08_setup_log") as curs:
            importProxDistal(curs, assembly)            

    return 0

if __name__ == '__main__':
    main()

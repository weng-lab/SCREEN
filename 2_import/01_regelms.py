#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor, vacumnAnalyze, makeIndex
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer, printt

allInitialCols = ("accession", "mpName", "negLogP",
                  "chrom", "start", "stop",
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

    makeIndex(curs, tableName, ["accession"])

def updateTable(curs, ctn, m):
    printt("updating max zscore", ctn)
    curs.execute("""
UPDATE {ctn}
SET
dnase_zscore_max      = (select max(x) from unnest(dnase_zscore) x),
ctcf_only_zscore_max  = (select max(x) from unnest(ctcf_only_zscore) x),
ctcf_dnase_zscore_max = (select max(x) from unnest(ctcf_dnase_zscore) x),
h3k27ac_only_zscore_max = (select max(x) from unnest(h3k27ac_only_zscore) x),
h3k27ac_dnase_zscore_max = (select max(x) from unnest(h3k27ac_dnase_zscore) x),
h3k4me3_only_zscore_max  = (select max(x) from unnest(h3k4me3_only_zscore) x),
h3k4me3_dnase_zscore_max = (select max(x) from unnest(h3k4me3_dnase_zscore) x)
""".format(ctn = ctn))

    printt("updating isProximal", ctn)
    curs.execute("""
UPDATE {ctn} as cre
SET isProximal = prox.isProximal
FROM {tnProx} as prox
WHERE cre.accession = prox.accession;
""".format(ctn = ctn,
           tnProx = m["assembly"] + "_isProximal"))

def doPartition(curs, tableName, m):
    curs.execute("""
DROP TABLE IF EXISTS {tn} CASCADE;
""".format(tn = tableName))

    curs.execute("""
        CREATE TABLE {tableName}
 (
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
 tads integer[],
 dnase_zscore_max numeric(8,3),
 ctcf_only_zscore_max numeric(8,3),
 ctcf_dnase_zscore_max numeric(8,3),
 h3k27ac_only_zscore_max numeric(8,3),
 h3k27ac_dnase_zscore_max numeric(8,3),
 h3k4me3_only_zscore_max numeric(8,3),
 h3k4me3_dnase_zscore_max numeric(8,3),
 isProximal boolean
        ); """.format(tableName = tableName))

    chroms = m["chrs"]
    for chrom in chroms:
        ctn = tableName + '_' + chrom
        curs.execute("""
DROP TABLE IF EXISTS {ctn} CASCADE;
CREATE TABLE {ctn} (
id serial PRIMARY KEY,
CHECK (chrom = '{chrom}')
) INHERITS ({tn});
""".format(tn = tableName, ctn = ctn, chrom = chrom))
        printt(ctn)

    d = m["d"]
    subsample = m["subsample"]
    for chrom in chroms:
        fn = "parsed." + chrom + ".tsv.gz"
        fnp = os.path.join(d, fn)
        if subsample:
            fnp = os.path.join(d, "sample", fn)
        ctn = tableName + '_' + chrom
        cols = allInitialCols
        with gzip.open(fnp) as f:
            printt("importing", fnp, "into", ctn)
            curs.copy_from(f, ctn, '\t', columns=cols)
        printt("imported", os.path.basename(fnp))
        updateTable(curs, ctn, m)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--sample', action="store_true", default=False)
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
        m["subsample"] = args.sample

        with getcursor(DBCONN, "08_setup_log") as curs:
            if 0:
                importProxDistal(curs, assembly)
                doPartition(curs, assembly + "_cre", m)
            else:
                curs.execute("""
ALTER TABLE {tn}
ADD COLUMN maxz numeric(8,3);
""".format(tn = assembly + "_cre"))
                curs.execute("""
UPDATE {tn}
SET maxz = GREATEST( dnase_zscore_max,
ctcf_only_zscore_max ,
ctcf_dnase_zscore_max ,
h3k27ac_only_zscore_max ,
h3k27ac_dnase_zscore_max ,
h3k4me3_only_zscore_max ,
h3k4me3_dnase_zscore_max )
""".format(tn = assembly + "_cre"))


        vacumnAnalyze(DBCONN.getconn(), m["tableName"], m["chrs"])

    return 0

if __name__ == '__main__':
    main()

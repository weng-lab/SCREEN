#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip, StringIO

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt
from db_utils import getcursor, vacumnAnalyze, makeIndex
from files_and_paths import Dirs, Tools, Genome, Datasets

AddPath(__file__, '../common/')
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS

def importProxDistal(curs, assembly):
    fnp = paths.path(assembly, assembly + "-Proximal-Distal.txt.gz")
    printt("reading", fnp)
    with gzip.open(fnp) as f:
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

def indexProxDistal(curs, assembly):
    tableName = assembly + "_isProximal"
    makeIndex(curs, tableName, ["accession"])

def updateTable(curs, ctn, m):
    printt("updating max zscore columns", ctn)
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

    printt("updating promoterMaxz and enhancerMaxz...")
    curs.execute("""
UPDATE {ctn}
SET promoterMaxz = GREATEST(
h3k4me3_only_zscore_max ,
h3k4me3_dnase_zscore_max ),

enhancerMaxz = GREATEST(
h3k27ac_only_zscore_max ,
h3k27ac_dnase_zscore_max )
""".format(ctn = ctn))

    printt("updating maxZ", ctn)
    curs.execute("""
UPDATE {ctn}
SET maxz = GREATEST( dnase_zscore_max,
ctcf_only_zscore_max ,
ctcf_dnase_zscore_max ,
h3k27ac_only_zscore_max ,
h3k27ac_dnase_zscore_max ,
h3k4me3_only_zscore_max ,
h3k4me3_dnase_zscore_max )
""".format(ctn = ctn))

def dropTables(curs, tableName, m):
    curs.execute("""
    DROP TABLE IF EXISTS {tn} CASCADE;
""".format(tn = tableName))

def doPartition(curs, tableName, m):
    curs.execute("""
    CREATE TABLE {tn}
 (
 id serial PRIMARY KEY,
 accession VARCHAR(20),
 mpName text,
 chrom VARCHAR(5),
 start integer,
 stop integer,
 conservation_signal real[],
 dnase_zscore real[],
 ctcf_only_zscore real[],
 ctcf_dnase_zscore real[],
 h3k27ac_only_zscore real[],
 h3k27ac_dnase_zscore real[],
 h3k4me3_only_zscore real[],
 h3k4me3_dnase_zscore real[],
 gene_all_distance integer[],
 gene_all_id integer[],
 gene_pc_distance integer[],
 gene_pc_id integer[],
 tads integer[],

 dnase_zscore_max real,
 ctcf_only_zscore_max real,
 ctcf_dnase_zscore_max real,
 h3k27ac_only_zscore_max real,
 h3k27ac_dnase_zscore_max real,
 h3k4me3_only_zscore_max real,
 h3k4me3_dnase_zscore_max real,
 isProximal boolean,
 maxz real,
 promoterMaxz real,
 enhancerMaxz real
 ); """.format(tn = tableName))

    chroms = m["chrs"]
    for chrom in chroms:
        ctn = tableName + '_' + chrom
        printt("drop and create", ctn)
        curs.execute("""
DROP TABLE IF EXISTS {ctn} CASCADE;
CREATE TABLE {ctn} (
CHECK (chrom = '{chrom}')
) INHERITS ({tn});
""".format(tn = tableName, ctn = ctn, chrom = chrom))

    d = m["d"]
    subsample = m["subsample"]
    for chrom in chroms:
        fn = "parsed." + chrom + ".tsv.gz"
        fnp = os.path.join(d, fn)
        if subsample:
            if "chr13" != chrom:
                fnp = os.path.join(d, "sample", fn)
        ctn = tableName + '_' + chrom
        cols = DB_COLS
        with gzip.open(fnp) as f:
            printt("importing", fnp, "into", ctn)
            curs.copy_from(f, ctn, '\t', columns=cols)

def updateTables(curs, tableName, m):
    d = m["d"]
    for chrom in chroms:
        ctn = tableName + '_' + chrom
        updateTable(curs, ctn, m)

def addCol(curs, assembly):
    printt("adding col...")
    curs.execute("""
ALTER TABLE {tn}
ADD COLUMN promoterMaxz real,
ADD COLUMN enhancerMaxz real;

UPDATE {tn}
SET promoterMaxz = GREATEST(
h3k4me3_only_zscore_max ,
h3k4me3_dnase_zscore_max ),
enhancerMaxz = GREATEST(
h3k27ac_only_zscore_max ,
h3k27ac_dnase_zscore_max )
""".format(tn = assembly + "_cre"))

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--sample', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    def makeInfo(assembly):
        return {"chrs" : chroms[assembly],
                       "assembly" : assembly,
                       "d" : paths.fnpCreTsvs(assembly),
                       "base" : paths.path(assembly),
                       "tableName" : assembly + "_cre"}

    infos = {"mm10" : makeInfo("mm10"),
             "hg19" : makeInfo("hg19")}

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)

        m = infos[assembly]
        m["subsample"] = args.sample

        if 1:
            print('***********', "drop tables")
            with getcursor(DBCONN, "dropTables") as curs:
                dropTables(curs, assembly + "_cre", m)
            print('***********', "create tables")
            with getcursor(DBCONN, "doPartition") as curs:
                doPartition(curs, assembly + "_cre", m)

            print('***********', "import proximal/distal info")
            with getcursor(DBCONN, "importProxDistal") as curs:
                importProxDistal(curs, assembly)
            with getcursor(DBCONN, "indexProxDistal") as curs:
                indexProxDistal(curs, assembly)

            print('***********', "update table cols")
            with getcursor(DBCONN, "doPartition") as curs:
                updateTable(curs, assembly + "_cre", m)
        else:
            # example to show how to add and populate column to
            #  master and, by inheritance, children tables...
            with getcursor(DBCONN, "08_setup_log") as curs:
                addCol(curs, assembly)

        print('***********', "vacumn")
        vacumnAnalyze(DBCONN.getconn(), m["tableName"], m["chrs"])

    return 0

if __name__ == '__main__':
    main()

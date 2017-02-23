#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from files_and_paths import Dirs, Tools, Genome, Datasets
from exp import Exp

AddPath(__file__, '../common/')
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS

def doImport(curs, assembly):
    if "hg19" == assembly:
        fnp = os.path.join(Dirs.metadata_base, "roderic/public_docs.crg.es/rguigo/encode/expressionMatrices/H.sapiens/hg19/2016_11/gene.V19.hg19.RAMPAGE.2016_11_23.tsv.gz")
    printt("reading", fnp)
    with gzip.open(fnp) as f:
        header = f.readline().rstrip('\n').split('\t')
        rows = [line.rstrip('\n').split('\t') for line in f]
    printt("read header and", len(rows), "rows")

    printt("rewriting")
    outF = StringIO.StringIO()
    for r in rows:
        row = r[:2]
        row += r[2].split('_') # chrom, start, stop, strand
        for t in r[3:]:
            if ':' in t:
                row.append(t.split(':')[0])
            else:
                row.append(t)
        outF.write('\t'.join(row) + '\n')
    outF.seek(0)

    cols = ["tss", "ensemblid_ver", "chrom", "start", "stop", "strand"]
    for h in header[3:]:
        h = h.split('_')[0]
        cols.append(h)
    exps = cols[6:]

    tableName = assembly + "_rampage"
    printt("copy into", tableName)
    curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}
(id serial PRIMARY KEY,
tss text,
ensemblid_ver text,
chrom text,
start integer,
stop integer,
strand VARCHAR(1),
{fields}
);""".format(tn = tableName, fields = ','.join([f + " real" for f in exps])))

    curs.copy_from(outF, tableName, '\t', columns = cols)

def doIndex(curs, assembly):
    tableName = assembly + "_rampage"
    makeIndex(curs, tableName, ["ensemblid_ver", "chrom"])
    makeIndexIntRange(curs, tableName, ["start", "stop"])

def metadata(curs, assembly):
    if "hg19" == assembly:
        fnp = os.path.join(Dirs.metadata_base, "roderic/public_docs.crg.es/rguigo/encode/expressionMatrices/H.sapiens/hg19/2016_11/gene.V19.hg19.RAMPAGE.2016_11_23.tsv.gz")
    printt("reading", fnp)
    with gzip.open(fnp) as f:
        header = f.readline().rstrip('\n').split('\t')

    expIDs = []
    for h in header[3:]:
        h = h.split('_')[0]
        expIDs.append(h)
    expIDs = list(set(expIDs))

    tableName = assembly + "_rampage_info"
    printt("dropping and creating", tableName)

    curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}
(id serial PRIMARY KEY,
expID text,
biosample_term_name text,
biosample_type text,
biosample_summary text
    ) """.format(tn = tableName))

    outF = StringIO.StringIO()

    for expID in expIDs:
        exp = Exp.fromJsonFile(expID)
        outF.write('\t'.join([expID,
                              exp.biosample_term_name,
                              exp.biosample_type,
                              exp.getExpJson()["biosample_summary"]
                              ]) + '\n')
    outF.seek(0)

    cols = ["expID", "biosample_term_name", "biosample_type",
            "biosample_summary"]
    curs.copy_from(outF, tableName, '\t', columns = cols)
    printt("\tok", curs.rowcount)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = ["hg19"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        with getcursor(DBCONN, "dropTables") as curs:
            if 0:
                doImport(curs, assembly)
                doIndex(curs, assembly)
            metadata(curs, assembly)

    return 0

if __name__ == '__main__':
    main()

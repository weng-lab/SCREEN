#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip
import StringIO

from determine_tissue import DetermineTissue

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from files_and_paths import Dirs, Tools, Genome, Datasets
from exp import Exp
from querydcc import QueryDCC
from cache_memcache import MemCacheWrapper

AddPath(__file__, '../common/')
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS
from config import Config

def doImport(curs, assembly):
    fnp = paths.path(assembly, "hg19-tss-rampage-matrix.txt.gz")
    printt("reading", fnp)
    with gzip.open(fnp) as f:
        header = f.readline().rstrip('\n').split('\t')
        rows = [line.rstrip('\n').split('\t') for line in f]
    printt("read header and", len(rows), "rows")

    fnp = paths.path(assembly, "hg19-tss-filtered.bed")
    with open(fnp) as f:
        tsses = [line.rstrip('\n').split('\t') for line in f]
    lookup = {r[3] : r for r in tsses}

    printt("rewriting")
    outF = StringIO.StringIO()
    for row in rows:
        r = [row[0]]
        t = lookup[row[0]]
        r.append(t[6]) # gene
        r.append(t[0]) # chrom
        r.append(t[1]) # start
        r.append(t[2]) # stop
        r.append(t[5]) # strand
        r.append(t[7]) # gene info
        r += row[1:]
        outF.write('\t'.join(r) + '\n')
    outF.seek(0)

    fileIDs = header[1:]

    cols = ["transcript", "ensemblid_ver", "chrom", "start", "stop",
            "strand", "geneInfo"] + fileIDs

    tableName = assembly + "_rampage"
    printt("copy into", tableName)
    curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}
(id serial PRIMARY KEY,
transcript text,
ensemblid_ver text,
chrom text,
start integer,
stop integer,
strand VARCHAR(1),
geneInfo text,
maxVal real,
{fields}
);""".format(tn = tableName, fields = ','.join([f + " real" for f in fileIDs])))

    curs.copy_from(outF, tableName, '\t', columns = cols)
    printt("inserted", curs.rowcount)

    curs.execute("""
UPDATE {tn}
SET maxVal = GREATEST( {fields} )
""".format(tn = tableName, fields = ','.join(fileIDs)))

def doIndex(curs, assembly):
    tableName = assembly + "_rampage"
    makeIndex(curs, tableName, ["ensemblid_ver", "chrom"])
    makeIndexIntRange(curs, tableName, ["start", "stop"])

def metadata(curs, assembly):
    fnp = paths.path(assembly, "hg19-tss-rampage-matrix.txt.gz")

    printt("reading", fnp)
    with gzip.open(fnp) as f:
        header = f.readline().rstrip('\n').split('\t')

    fileIDs = header[1:]

    tableName = assembly + "_rampage_info"
    printt("dropping and creating", tableName)

    curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}
(id serial PRIMARY KEY,
expID text,
fileID text,
biosample_term_name text,
biosample_type text,
biosample_summary text,
tissue text
) """.format(tn = tableName))

    outF = StringIO.StringIO()

    mc = MemCacheWrapper()
    qd = QueryDCC(cache = mc)

    for fileID in fileIDs:
        exp = qd.getExpFromFileID(fileID)
        expID = exp.encodeID
        tissue = DetermineTissue.TranslateTissue(assembly, exp)
        outF.write('\t'.join([expID,
                              fileID,
                              exp.biosample_term_name,
                              exp.biosample_type,
                              exp.getExpJson()["biosample_summary"],
                              tissue
                              ]) + '\n')
    outF.seek(0)

    cols = ["expID", "fileID", "biosample_term_name", "biosample_type",
            "biosample_summary", "tissue"]
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

    assemblies = ["hg19"] #Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        with getcursor(DBCONN, "dropTables") as curs:
            doImport(curs, assembly)
            metadata(curs, assembly)
            doIndex(curs, assembly)
    return 0

if __name__ == '__main__':
    main()

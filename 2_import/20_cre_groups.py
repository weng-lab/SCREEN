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

lookup = {"ctcf-like" : 0,
          "enhancer-like" : 1,
          "other-cres" : 2,
          "promoter-like" : 3,
          "rdhs" : 4}

def importGroup(curs, assembly):
    fnp = paths.path(assembly, assembly + "-cRE-Groups.bed.gz")

    tableName = assembly + "_cre_group"
    print("drop and create", tableName)
    curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}
(id serial PRIMARY KEY,
accession text,
cre_group integer
);""".format(tn = tableName))

    if not os.path.exists(fnp):
        printt("skipping load")
    else:
        printt("reading", fnp)
        with gzip.open(fnp) as f:
            rows = [line.rstrip('\n').split(' ') for line in f]

        printt("rewriting")
        outF = StringIO.StringIO()
        for r in rows:
            row = r[0] + '\t' + str(lookup[r[1]]) + '\n'
            outF.write(row)
        outF.seek(0)

        printt("copy into", tableName)

        curs.copy_from(outF, tableName, '\t', columns=('accession', 'cre_group'))

def indexCreGroup(curs, assembly):
    tableName = assembly + "_cre_group"
    makeIndex(curs, tableName, ["accession"])

def updateTable(curs, tn, assembly):
    printt("adding col", tn)
    curs.execute("""
ALTER TABLE {tn}
ADD COLUMN cre_group integer;
""".format(tn = tn))

    printt("updating cre_group", tn)
    curs.execute("""
UPDATE {tn} as cre
SET cre_group = cg.cre_group
FROM {cg} as cg
WHERE cre.accession = cg.accession;
""".format(tn = tn,
           cg = assembly + "_cre_group"))

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

        with getcursor(DBCONN, "dropTables") as curs:
            importGroup(curs, assembly)
            indexCreGroup(curs, assembly)
            updateTable(curs, assembly + "_cre", assembly)

        print('***********', "vacumn")
        vacumnAnalyze(DBCONN.getconn(), m["tableName"], m["chrs"])

    return 0

if __name__ == '__main__':
    main()

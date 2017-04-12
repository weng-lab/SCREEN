#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt, printWroteNumLines
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from files_and_paths import Dirs, Tools, Genome, Datasets
from exp import Exp

AddPath(__file__, '../common/')
from dbconnect import db_connect, db_connect_single
from constants import chroms, paths, DB_COLS
from config import Config

AddPath(__file__, '../website/common/')
from pg_common import PGcommon
from pg import PGsearch
from postgres_wrapper import PostgresWrapper

class Concordant:
    def __init__(self, curs, assembly, pg):
        self.curs = curs
        self.assembly = assembly
        self.pg = pg
        self.tableName = assembly + "_concordant"
        self.tableNameCts = assembly + "_concordant_cts"
        self.outFnp = paths.path(self.assembly, "extras", "concordant.tsv.gz")

    def run(self):
        self._setupTable()
        self._doImport()
        self._doIndex()
        self._doUpdate()
        
    def _setupTable(self):
        printt("drop and create", self.tableName)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};
        CREATE TABLE {tn}
        (id serial PRIMARY KEY,
        accession text,
        concordant boolean[]
        );""".format(tn = self.tableName))

    def runCts(self):
        printt("drop and create", self.tableNameCts)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};
        CREATE TABLE {tn}
        (id serial PRIMARY KEY,
cellTypeName text,
pgidx integer
        );""".format(tn = self.tableNameCts))

        printt("reading", self.outFnp)
        with gzip.open(self.outFnp) as f:
            header = f.readline().rstrip('\n').split('\t')
        printt("rewrite rows")
        outF = StringIO.StringIO()
        counter = 1
        for h in header[1:]:
            outF.write('\t'.join([h, str(counter)]) + '\n')
            counter += 1
        outF.seek(0)
        cols = ["cellTypeName", "pgidx"]
        self.curs.copy_from(outF, self.tableNameCts, '\t', columns = cols)
        printt("inserted", "{:,}".format(self.curs.rowcount), self.tableNameCts)

    def _doImport(self):
        printt("reading", self.outFnp)
        with gzip.open(self.outFnp) as f:
            header = f.readline().rstrip('\n').split('\t')
            rows = [line.rstrip('\n').split('\t') for line in f]
        printt("header:", header)
        printt("rows", "{:,}".format(len(rows)))

        self.cts = header[1:]

        printt("rewrite rows")
        outF = StringIO.StringIO()
        for r in rows:
            outF.write('\t'.join([r[0], "{" + ",".join(r[1:]) + "}"]) + '\n')
        outF.seek(0)
        cols = ["accession", "concordant"]
        self.curs.copy_from(outF, self.tableName, '\t', columns = cols)
        printt("inserted", "{:,}".format(self.curs.rowcount))

    def _doUpdate(self):
        printt("adding col...")
        self.curs.execute("""
        ALTER TABLE {tncres}
        DROP COLUMN IF EXISTS concordant;

        ALTER TABLE {tncres}
        ADD COLUMN concordant boolean[];

        UPDATE {tncres} as cres
        SET concordant = cg.concordant
        FROM {tn} as cg
        where cg.accession = cres.accession
    """.format(tn = self.tableName, tncres = self.assembly + "_cre_all"))
        if 0 == self.curs.rowcount:
            raise Exception("error: no cRE rows updated")
        printt("updated", "{:,}".format(self.curs.rowcount))

    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["accession"])

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        pg = PostgresWrapper(DBCONN)
        with getcursor(DBCONN, "dropTables") as curs:
            icg = Concordant(curs, assembly, pg)
            icg.run()
            icg.runCts()
        with db_connect_single(os.path.realpath(__file__)) as conn:
            if 0:
                vacumnAnalyze(conn, assembly + "_cre_all", [])

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    return run(args, DBCONN)
        
if __name__ == '__main__':
    main()
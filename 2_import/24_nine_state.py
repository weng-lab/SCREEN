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

class NineState:
    def __init__(self, curs, assembly, pg):
        self.curs = curs
        self.assembly = assembly
        self.pg = pg
        self.tableName = assembly + "_nine_state"
        self.inFnp = paths.path(self.assembly,
                                self.assembly + "-Look-Up-Matrix.txt")

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
        cellTypeName text,
        cellTypeDesc text,
        dnase text,
        h3k4me3 text,
        h3k27ac text,
        ctct text
        );""".format(tn = self.tableName))

    def _doImport(self):
        printt("reading", self.inFnp)
        with open(self.inFnp) as f:
            rows = [line.rstrip('\n').split('\t') for line in f]
        printt("rows", "{:,}".format(len(rows)))

        printt("rewrite rows")
        outF = StringIO.StringIO()
        for r in rows:
            outF.write('\t'.join(r) + '\n')
        outF.seek(0)
        cols = ["cellTypeName", "cellTypeDesc", "dnase", "h3k4me3",
                "h3k27ac", "ctct"]
        self.curs.copy_from(outF, self.tableName, '\t', columns = cols)
        printt("inserted", "{:,}".format(self.curs.rowcount))

    def _doUpdate(self):
        printt("adding col...")
        self.curs.execute("""
        ALTER TABLE {tncres}
        DROP COLUMN IF EXISTS cellTypeDesc;

        ALTER TABLE {tncres}
        ADD COLUMN cellTypeDesc text;

        UPDATE {tncres} as ds
        SET cellTypeDesc = ns.cellTypeDesc
        FROM {tn} as ns
        where ds.cellTypeName = ns.cellTypeName
    """.format(tn = self.tableName, tncres = self.assembly + "_datasets"))
        if 0 == self.curs.rowcount:
            raise Exception("error: no cRE rows updated")
        printt("updated", "{:,}".format(self.curs.rowcount))

    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["cellTypeName", "cellTypeDesc"])

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        pg = PostgresWrapper(DBCONN)
        with getcursor(DBCONN, "dropTables") as curs:
            icg = NineState(curs, assembly, pg)
            icg.run()

    for assembly in assemblies:
        with db_connect_single(os.path.realpath(__file__)) as conn:
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

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
from dbconnect import db_connect, db_connect_single
from constants import chroms, paths, DB_COLS
from config import Config

class ImportCreGroups:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_cre_groups"
        self.tableNameCts = self.tableName + "_cts"

    def run(self):
        self._doImport()
        self._doIndex()
        self._vac()
        
    def _setupTable(self):
        printt("drop and create", self.tableName)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};
        CREATE TABLE {tn}
        (id serial PRIMARY KEY,
        rDHS text,
        accession text,
        {fields}
        );""".format(tn = self.tableName,
                     fields = ','.join([f + " VARCHAR(1)" for f in self.ctsPg])))

    def _setupTableCts(self):
        printt("drop and create", self.tableNameCts)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};
        CREATE TABLE {tn}
        (id serial PRIMARY KEY,
        cellTypeAndName text,
        pgCellTypeAndName text
        );""".format(tn = self.tableNameCts))

    def _doImport(self):
        if "hg19" == self.assembly:
            fnp = paths.path("hg19", "hg19.cts.21only.txt")
        printt("reading", fnp)
        with open(fnp) as f:
            header = f.readline().rstrip('\n').split('\t')
        printt("header:", header)

        self.ctsOrig = header[1:]
        self.ctsPg = [h.replace('-', '_') for h in self.ctsOrig]
        
        self._setupTable()

        cols = ["rDHS"] + self.ctsPg
        with open(fnp) as f:
            f.readline() # header
            self.curs.copy_from(f, self.tableName, '\t', columns = cols)
        printt("inserted", "{:,}".format(self.curs.rowcount))

        self.curs.execute("""
        UPDATE {tn} as cg
        set accession = cres.accession
        from {tncres} as cres
        where cg.rDHS = cres.rDHS
        """.format(tn = self.tableName, tncres = self.assembly + "_cre_all"))
        printt("updated", "{:,}".format(self.curs.rowcount))

        printt("drop column rDHS")
        self.curs.execute("""
        ALTER TABLE {tn} 
        DROP COLUMN rDHS;
        """.format(tn = self.tableName))

        printt("import cell types", self.tableNameCts)
        rows = zip(self.ctsOrig, self.ctsPg)
        outF = StringIO.StringIO()
        for r in rows:
            outF.write('\t'.join(r) + '\n')
        outF.seek(0)

        self._setupTableCts()
        cols = ["cellTypeAndName", "pgCellTypeAndName"]
        self.curs.copy_from(outF, self.tableNameCts, '\t', columns = cols)
        printt("inserted", "{:,}".format(self.curs.rowcount))
        
    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["accession"])

    def _vac(self):
        with db_connect_single(os.path.realpath(__file__)) as conn:
            vacumnAnalyze(conn, self.tableName, [])

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
            icg = ImportCreGroups(curs, assembly)
            icg.run()

    return 0

if __name__ == '__main__':
    main()

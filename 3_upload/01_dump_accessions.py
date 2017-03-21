#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt
from db_utils import getcursor, vacumnAnalyze, makeIndex
from files_and_paths import Dirs, Tools, Genome, Datasets
from exp import Exp

AddPath(__file__, '../common/')
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS
from config import Config

class DumpAccessions:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def _print(self, tableName):
        self.curs.execute("""
SELECT fileID
from {tn}
        """.format(tn = tableName))
        for r in self.curs.fetchall():
            print(r[0])

    def _ge(self):
        tableName = "r_rnas_" + self.assembly
        self.curs.execute("""
SELECT encode_id
from {tn}
        """.format(tn = tableName))
        expIDs = [r[0] for r in self.curs.fetchall()]
        fileIDs = []

        for expID in expIDs:
            exp = Exp.fromJsonFile(expID)
            for f in exp.files:
                if self.assembly == f.assembly:
                    if f.isGeneQuantifications():
                        fileIDs.append(f.fileID)
        print('\n'.join(fileIDs))
        
    def run(self):
        self._print(self.assembly + "_datasets")

        if "hg19" == self.assembly:
            self._print(self.assembly + "_rampage_info")

        self._ge()
            
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--sample', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        with getcursor(DBCONN, "DumpAccessions") as curs:
            da = DumpAccessions(curs, assembly)
            da.run()

    return 0

if __name__ == '__main__':
    main()

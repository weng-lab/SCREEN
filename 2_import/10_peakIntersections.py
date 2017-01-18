#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs

class ImportPeakIntersections:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_" + "peakIntersections"

    def setupTable(self):
        print("dropping and creating table", self.tableName)
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
    CREATE TABLE {tableName}(
    id serial PRIMARY KEY,
    accession text,
    tf jsonb,
    histone jsonb,
    dnase jsonb
    );
    """.format(tableName = self.tableName))
        print("\tok")

    def run(self):
        dataF = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/"
        dataF = os.path.join(dataF, "ver9", self.assembly, "newway")
        fnp = os.path.join(dataF, "peakIntersections.tsv.gz")
        self.setupTable()

        cols = "accession tf histone dnase".split(' ')
        with open(fnp) as f:
            self.curs.copy_from(f, self.tableName, '\t', columns=cols)
        print("\tcopied in", fnp, self.curs.rowcount)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for assembly in ["mm10", "hg19"]:
        with getcursor(DBCONN, "main") as curs:
            ipi = ImportPeakIntersections(curs, assembly)
            ipi.run()

if __name__ == '__main__':
    main()

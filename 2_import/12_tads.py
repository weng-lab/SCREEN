#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange

class ImportTADinfo:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_tads_info"

    def setupTable(self):
        printt("dropping and creating table", self.tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}(
id serial PRIMARY KEY,
chrom text,
start integer,
stop integer,
tadName text
);
    """.format(tableName = self.tableName))

    def run(self):
        fnp = paths.path(self.assembly, "extras", "TADs.bed.gz")

        printt("reading", fnp)
        with gzip.open(fnp) as f:
            rows = [line.rstrip().split('\t') for line in f]
        f = StringIO.StringIO()
        for r in rows:
            f.write('\t'.join(r) + '\n')
        f.seek(0)

        self.setupTable()
        self.curs.copy_from(f, self.tableName, '\t',
                          columns=("chrom", "start", "stop", "tadName"))
        printt("copied in TADs", self.curs.rowcount)

    def index(self):
        makeIndex(self.curs, self.tableName, ["tadName"])
        makeIndexIntRange(self.curs, self.tableName, ["start", "stop"])

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    assemblies = ["hg19"] #Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    DBCONN = db_connect(os.path.realpath(__file__))

    for assembly in assemblies:
        with getcursor(DBCONN, "main") as curs:
            iti = ImportTADinfo(curs, assembly)
            iti.run()
            iti.index()

if __name__ == '__main__':
    main()

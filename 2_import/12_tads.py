#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange

class ImportTADs:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_" + "tads"

    def setupTable(self):
        printt("dropping and creating table", self.tableName)
        self.curs.execute("""
 DROP TABLE IF EXISTS {tableName};
 CREATE TABLE {tableName}(
 id serial PRIMARY KEY,
 accession VARCHAR(20),
 mpName text,
 tadName text
);
    """.format(tableName = self.tableName))

    def run(self):
        fnp = paths.path(self.assembly, "hg19-TAD-Accessions.txt.gz")

        printt("reading", fnp)
        with gzip.open(fnp) as f:
            rows = [line.rstrip().split('\t') for line in f]
        f = StringIO.StringIO()
        for r in rows:
            f.write('\t'.join(r) + '\n')
        f.seek(0)

        self.setupTable()
        self.curs.copy_from(f, self.tableName, '\t',
                          columns=("mpName", "tadName"))
        printt("copied in TADs", self.curs.rowcount)

        printt("updaing accessions")
        self.curs.execute("""
UPDATE {tadTableName} as tads
SET accession = cre.accession
FROM {tn} as cre
where tads.mpname = cre.mpname
""".format(tadTableName = "hg19_tads", tn = "hg19_cre"))

    def index(self):
        makeIndex(self.curs, self.tableName, ["accession", "tadName"])

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
        fnp = paths.path(self.assembly, "TADs.bed.gz")

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
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    for assembly in ["hg19"]:
        with getcursor(DBCONN, "main") as curs:
            iti = ImportTADinfo(curs, assembly)
            iti.run()
            iti.index()

            ipi = ImportTADs(curs, assembly)
            ipi.run()
            ipi.index()


if __name__ == '__main__':
    main()

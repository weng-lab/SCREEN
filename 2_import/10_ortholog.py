#!/usr/bin/env python2

from __future__ import print_function
import os
import sys
import json
import psycopg2
import argparse
import gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from constants import paths
from dbconnect import db_connect
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex


class ImportLiftover:
    def __init__(self, curs):
        self.curs = curs
        self.tableName = "mm10_liftover"

    def setupLiftover(self):
        printt("dropping and creating", self.tableName)
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
    CREATE TABLE {tableName}(
    id serial PRIMARY KEY,
    chrom text,
    start integer,
    stop integer,
    mouseAccession text,
    humanAccession text,
    overlap integer
    );
    """.format(tableName=self.tableName))

    def run(self):
        fnp = paths.path("mm10", "mm10-orthologs.txt.gz")

        self.setupLiftover()

        printt("reading", fnp)
        with gzip.open(fnp) as f:
            mmToHg = [r.rstrip('\n').split('\t') for r in f.readlines()]

        cols = "chrom start stop mouseAccession humanAccession overlap".split(' ')
        printt("writing stringio...")
        outF = StringIO.StringIO()
        for r in mmToHg:
            outF.write("\t".join([r[0], r[1], r[2], r[4], r[6], r[7]]) + '\n')
        outF.seek(0)

        printt("copy into db...")
        self.curs.copy_from(outF, self.tableName, '\t', columns=cols)
        printt("\tok", self.curs.rowcount)

        makeIndex(self.curs, self.tableName, ["mouseAccession", "humanAccession"])


def run(args, DBCONN):
    printt('***********')
    with getcursor(DBCONN, "main") as curs:
        il = ImportLiftover(curs)
        il.run()
    return 0


def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    return run(args, DBCONN)


if __name__ == '__main__':
    main()

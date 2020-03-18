#!/usr/bin/env python3


import os
import sys
import json
import psycopg2
import argparse
import gzip
import io

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from constants import paths
from dbconnect import db_connect
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex


class ImportLiftover:

    @staticmethod
    def _load_ccRE_map(assembly):
        ret = {}
        with open(paths.path(assembly, "raw", "cREs.sorted.bed"), 'r') as f:
            for line in f:
                line = line.strip().split('\t')
                ret[line[4]] = tuple(line[:4])
        return ret
    
    def __init__(self, curs):
        self.curs = curs
        self.tableName = "mm10_liftover"
        self.ccREmaps = {
            "hg19": ImportLiftover._load_ccRE_map("hg19"),
            "mm10": ImportLiftover._load_ccRE_map("mm10")
        }

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
        fnp = paths.path("mm10", "Two-Way-Synteny.txt")
        self.setupLiftover()

        printt("reading", fnp)
        mmToHG = []
        with open(fnp, 'r') as f:
            for line in f:
                line = line.strip().split('\t')
                mc, ms, me, md = self.ccREmaps["mm10"][line[1]]
                hc, hs, he, hd = self.ccREmaps["hg19"][line[0]]
                mmToHg.append([hc, hs, he, md, line[1], hd, line[0]])

        cols = "chrom start stop mouseAccession humanAccession overlap".split(' ')
        printt("writing stringio...")
        outF = io.StringIO()
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

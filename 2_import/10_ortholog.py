#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs

class ImportLiftover:
    def __init__(self, curs):
        self.curs = curs
        self.tableName = "mm10_liftover"
        self.d = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9"

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
    """.format(tableName = self.tableName))

    def getMpToAccLookup(self, assembly):
        fnp = os.path.join(self.d, assembly, "raw", "masterPeaks.bed.gz")
        printt("making lookup", assembly, "from", fnp)
        ret = {}
        with gzip.open(fnp) as f:
            for line in f:
                toks = line.rstrip().split('\t')
                ret[toks[3]] = toks[4]
        return ret

    def run(self):
        fnp = os.path.join(self.d, "liftover", "mm10-to-hg19-50.bed.gz")

        self.setupLiftover()

        printt("reading", fnp)
        with gzip.open(fnp) as f:
            mmToHg = [r.rstrip().split('\t') for r in f.readlines()]

        mmLookup = self.getMpToAccLookup("mm10")
        hgLookup = self.getMpToAccLookup("hg19")

        ret = []
        for idx, r in enumerate(mmToHg):
            try:
                mmToHg[idx][3] = mmLookup[r[3]]
            except:
                print("bad liftOver?", idx, r)
                continue
            try:
                mmToHg[idx][4] = hgLookup[r[4]]
            except:
                print("bad liftOver?", idx, r)
                continue
            ret.append(mmToHg[idx])

        cols = "chrom start stop mouseAccession humanAccession overlap".split(' ')
        printt("writing stringio...")
        outF = StringIO.StringIO()
        for r in ret:
            outF.write("\t".join(r) + '\n')
        outF.seek(0)

        printt("copy into db...")
        self.curs.copy_from(outF, self.tableName, '\t', columns=cols)
        printt("\tok", self.curs.rowcount)

        makeIndex(self.curs, self.tableName, ["mouseAccession", "humanAccession"])

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    with getcursor(DBCONN, "main") as curs:
        il = ImportLiftover(curs)
        il.run()

if __name__ == '__main__':
    main()

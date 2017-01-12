#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils

class PolishData:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def setupCREcounts(self):
        src = self.assembly + "_cre"
        tableName = src + "_nums"
        print("dropping and creating", tableName, "...")
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
    CREATE TABLE {tableName} AS SELECT chrom, count(0) FROM {src} GROUP BY chrom
        """.format(tableName = tableName, src=src))
        print("created", tableName)

    def setupCREhistograms(self):
        numBins = 100
        with open(Genome.ChrLenByAssembly(self.assembly)) as f:
            lens = [x.rstrip().split('\t') for x in f.readlines() if x]
            chrLens = { x[0] : x[1] for x in lens }
        for chrom in chroms[self.assembly]:
            mmax = chrLens[chrom]
            tn = self.assembly + "_cre_" + chrom
            self.curs.execute("""
SELECT WIDTH_BUCKET(start, 0, {mmax}, {numBins}), COUNT(start) FROM {tn}
GROUP BY 1 ORDER BY 1""".format(mmax=mmax, numBins=numBins, tn=tn))
            bucketVals = [x[1] for x in self.curs.fetchall()]
            print(chrom, mmax, len(bucketVals))

    def run(self):
        self.setupCREhistograms()
        self.setupCREcounts()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for assembly in ["mm10"]:
        with getcursor(DBCONN, "08_setup_log") as curs:
            pd = PolishData(curs, assembly)
            pd.run()

    return 0

if __name__ == '__main__':
    main()

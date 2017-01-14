#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths

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
        outTableName = self.assembly + "_cre_bins"
        print("dropping and creating", outTableName, "...")
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
chrom VARCHAR(5),
numBins integer,
binMax integer,
buckets jsonb);""".format(tableName = outTableName))
        print("created", outTableName)

        numBins = 100 # open end, so will get numBins + 1
        for chrom, mmax in chrom_lengths[self.assembly].iteritems():
            if chrom not in chroms[self.assembly]:
                continue
            tn = self.assembly + "_cre_" + chrom
            self.curs.execute("""
SELECT min(start) as left,
WIDTH_BUCKET(start, 0, {mmax}, {numBins}) as bucket_num,
COUNT(start) FROM {tn}
GROUP BY 2 ORDER BY 2""".format(outTableName = outTableName,
                                chrom = chrom, mmax = mmax, numBins = numBins, tn = tn))
            buckets = {}
            mmax = 0
            for r in self.curs.fetchall():
                buckets[r[0]] = r[2]
                mmax = max(mmax, r[2])
            print(chrom, numBins, buckets, mmax)
            self.curs.execute("""
INSERT INTO {outTableName} (chrom, numBins, binMax, buckets)
VALUES (%s, %s, %s, %s)""".format(outTableName =  outTableName),
                              (chrom,
                               numBins,
                               mmax,
                               json.dumps(buckets)))

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

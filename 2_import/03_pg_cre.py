#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import json
import psycopg2
import re
import argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, printt


class PolishData:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def setupCREcounts(self):
        src = self.assembly + "_cre_all"
        tableName = src + "_nums"
        printt("dropping and creating", tableName, "...")
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
AS SELECT chrom, count(0)
FROM {src}
GROUP BY chrom
        """.format(tableName=tableName, src=src))
        printt("created", tableName)

    def setupCREhistograms(self):
        outTableName = self.assembly + "_cre_bins"
        printt("dropping and creating", outTableName, "...")
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
chrom VARCHAR(5),
numBins integer,
binMax integer,
buckets jsonb);""".format(tableName=outTableName))
        printt("created", outTableName)

        numBins = 500  # open end, so will get numBins + 1
        for chrom, mmax in chrom_lengths[self.assembly].iteritems():
            if chrom not in chroms[self.assembly]:
                continue
            tn = self.assembly + "_cre_all"
            self.curs.execute("""
SELECT min(start) as left,
WIDTH_BUCKET(start, 0, {mmax}, {numBins}) as bucket_num,
COUNT(start) FROM {tn}
WHERE chrom = %s
GROUP BY 2
ORDER BY 2
""".format(outTableName=outTableName,
                chrom=chrom, mmax=mmax, numBins=numBins,
                tn=tn), (chrom, ))
            buckets = [[0, 0]] * (numBins + 1)
            mmax = 0
            for r in self.curs.fetchall():
                buckets[r[1]] = [r[0], r[2]]
                mmax = max(mmax, r[2])
            #printt(chrom, numBins, buckets, mmax)
            self.curs.execute("""
INSERT INTO {outTableName} (chrom, numBins, binMax, buckets)
VALUES (%s, %s, %s, %s)""".format(outTableName=outTableName),
                              (chrom,
                               numBins + 1,
                               mmax,
                               json.dumps(buckets)))

    def setupRangeFunction(self):
        printt("create range function...")
        self.curs.execute("""
create or replace function intarray2int4range(arr int[]) returns int4range as $$
    select int4range(min(val), max(val) + 1) from unnest(arr) as val;
$$ language sql immutable;

create or replace function numarray2numrange(arr numeric[]) returns numrange as $$
    select numrange(min(val), max(val) + 1) from unnest(arr) as val;
$$ language sql immutable;
        """)

    def setupEstimateCountFunction(self):
        # https://wiki.postgresql.org/wiki/Count_estimate
        printt("creating count estimate function")
        self.curs.execute("""
CREATE OR REPLACE FUNCTION count_estimate(query text) RETURNS INTEGER AS
$func$
DECLARE
    rec   record;
    ROWS  INTEGER;
BEGIN
    FOR rec IN EXECUTE 'EXPLAIN ' || query LOOP
        ROWS := SUBSTRING(rec."QUERY PLAN" FROM ' rows=([[:digit:]]+)');
        EXIT WHEN ROWS IS NOT NULL;
    END LOOP;

    RETURN ROWS;
END
$func$ LANGUAGE plpgsql;
""")

    def run(self):
        self.setupRangeFunction()
        self.setupEstimateCountFunction()
        self.setupCREhistograms()
        self.setupCREcounts()


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "08_setup_log") as curs:
            pd = PolishData(curs, assembly)
            pd.run()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    return run(args, DBCONN)


if __name__ == '__main__':
    main()

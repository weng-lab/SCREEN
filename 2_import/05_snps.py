#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs

class SetupSnps:
    def __init__(self, curs, assembly, sample):
        self.curs = curs
        self.assembly = assembly
        self.sample = sample

    def setupAndCopy(self, tableName, f):
        print("creating table and copying in", tableName)

        self.curs.execute("""
        DROP TABLE IF EXISTS {tableName};

        CREATE TABLE {tableName}(
        id serial PRIMARY KEY,
        start integer,
        stop integer,
        name varchar(15)
    );
    """.format(tableName=tableName))

        self.curs.copy_from(f, tableName, '\t',
                          columns=("start", "stop", "name"))
        print("\tok", self.curs.rowcount)

        self.curs.execute("""
        CREATE INDEX {tableName}_idx01 ON {tableName}(name);
    """.format(tableName=tableName))
        print("\tok index")

    def run(self):
        fns = {"mm10" : "snps142common.mm10.bed.gz",
               "hg19" : "snps144common.hg19.bed.gz"}
        fnp = os.path.join(Dirs.dbsnps, fns[self.assembly])
        if self.sample:
            fnp = os.path.join(Dirs.dbsnps, "sample", fns[self.assembly])
        print("loading", fnp)

        rowsByChrom = {}
        for chrom in chroms[self.assembly]:
            rowsByChrom[chrom] = StringIO.StringIO()

        with gzip.open(fnp) as f:
            for r in f:
                toks = r.rstrip().split('\t')
                if toks[0] in rowsByChrom:
                    rowsByChrom[toks[0]].write('\t'.join(toks[1:]) + '\n')

        for chrom, snps in rowsByChrom.iteritems():
            tableName = self.assembly + "_snps_" + chrom
            snps.seek(0)
            self.setupAndCopy(tableName, snps)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--sample', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for assembly in ["mm10", "hg19"]:
        with getcursor(DBCONN, "main") as curs:
            ss = SetupSnps(curs, assembly, args.sample)
            ss.run()

if __name__ == '__main__':
    main()

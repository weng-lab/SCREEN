#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from get_tss import Genes
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, printWroteNumLines, printt

class GWASsnps:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def run(self):
        tableName = self.assembly + "_snps"
        printt("dropping and creating", tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
snp varchar(15),
chrom text,
start integer,
stop integer
);
""".format(tableName = tableName))

        fns = {"mm10" : "snps142common.mm10.bed.gz",
               "hg19" : "snps144common.hg19.bed.gz"}
        fnp = os.path.join(Dirs.dbsnps, fns[self.assembly])

        printt("importing", fnp)
        with gzip.open(fnp) as f:
            cols = ["chrom", "start", "stop", "snp"]
            self.curs.copy_from(f, tableName, '\t', columns=cols)
        printt("imported", self.curs.rowcount)

        makeIndex(self.curs, tableName, ["snp"])

def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = Config.assemblies

    for assembly in assemblies:
        with getcursor(DBCONN, "04_cellTypeInfo") as curs:
            g = GWASsnps(curs, assembly)
            g.run()

    return 0

if __name__ == '__main__':
    main()

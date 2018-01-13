#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import json
import psycopg2
import re
import argparse
import gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from get_tss import Genes
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, printWroteNumLines, printt


class GWASld:
    def __init__(self, curs, pop = "EUR"):
        self.curs = curs
        self.fnp = os.path.join(paths.v4d, "GWAS/LD_%s.tsv.gz" % pop)
        self.tableName = "ld_%s" % pop.lower()

    def run(self):
        tableName = self.tableName
        printt("dropping and creating", tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
        snp VARCHAR(30),
info text
);
""".format(tableName=tableName))

        printt("importing", self.fnp)
        with gzip.open(self.fnp) as f:
            cols = ["snp", "info"]
            self.curs.copy_from(f, tableName, '\t', columns=cols)
        printt("imported", self.curs.rowcount)

        makeIndex(self.curs, tableName, ["snp"])


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--population', default="EUR", type=str)
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    with getcursor(DBCONN, "04_cellTypeInfo") as curs:
        g = GWASld(curs, args.population)
        g.run()

    return 0


if __name__ == '__main__':
    main()

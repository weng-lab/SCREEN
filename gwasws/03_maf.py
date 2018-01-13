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


class GWASmaf:
    def __init__(self, curs, fnp = "/home/pratth/data/zusers/moorej3/haploreg_v4.0.MAF.bed", tn = "eur_maf"):
        self.curs = curs
        self.tableName = tn
        with open(fnp, 'r') as f:
            with open("/tmp/" + os.path.basename(fnp), 'wb') as o:
                for line in f:
                    line = line.strip().split('\t')
                    if ';' in line[4]:
                        for snpid in line[4].split(';'):
                            p = [line[0], line[1], line[2], snpid, line[5], line[6], line[7]]
                            o.write('\t'.join(p) + '\n')
                    else:
                        p = [line[0], line[1], line[2], line[4], line[5], line[6], line[7]]
                        o.write('\t'.join(p) + '\n')
        self.fnp = "/tmp/" + os.path.basename(fnp)

    def run(self):
        tableName = self.tableName
        printt("dropping and creating", tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
        chr VARCHAR(10),
        startpos INT,
        stoppos INT,
        snp VARCHAR(15),
        refallele VARCHAR(100000),
        altallele VARCHAR(100000),
        frequency VARCHAR(20)
);
""".format(tableName=tableName))

        printt("importing", self.fnp)
        with open(self.fnp) as f:
            cols = ["chr", "startpos", "stoppos", "snp", "refallele", "altallele", "frequency"]
            self.curs.copy_from(f, tableName, '\t', columns=cols)
        printt("imported", self.curs.rowcount)

        makeIndex(self.curs, tableName, ["snp"])


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--fnp', default="", type=str)
    parser.add_argument('--pop', default="eur", type=str)
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    with getcursor(DBCONN, "04_cellTypeInfo") as curs:
        if args.fnp != "":
            g = GWASmaf(curs, args.fnp, args.pop + "_maf")
        else:
            g = GWASmaf(curs, tn = args.pop + "_maf")
        g.run()

    return 0


if __name__ == '__main__':
    main()

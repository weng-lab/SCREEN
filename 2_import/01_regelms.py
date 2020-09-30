#!/usr/bin/env python2

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function
import os
import sys
import json
import psycopg2
import re
import argparse
import gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt
from db_utils import getcursor, vacumnAnalyze, makeIndex
from files_and_paths import Dirs, Tools, Genome, Datasets

AddPath(__file__, '../common/')
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS
from config import Config


class ImportCREs:
    def __init__(self, DBCONN, assembly, sample):
        self.DBCONN = DBCONN
        self.assembly = assembly
        self.sample = sample

        self.chroms = chroms[assembly]
        self.tableName_cre = assembly + "_cre"
        self.tableName_cre_all = assembly + "_cre_all"

    def run(self):
        with getcursor(self.DBCONN, "ImportCREs") as curs:
            self.makeTable(curs)
            self.doImport(curs)
            self.selectInto(curs)

    def vac(self):
        print('***********', "vacumn")
        vacumnAnalyze(self.DBCONN.getconn(), self.tableName_cre_all)

    def makeTable(self, curs):
        print('***********', "drop and create table")
        curs.execute("""
    DROP TABLE IF EXISTS {tn} CASCADE;

    CREATE TABLE {tn}
     (
     id serial PRIMARY KEY,
     accession VARCHAR(20),
     rDHS VARCHAR(20),
     chrom VARCHAR(5),
     start integer,
     stop integer,
     pct VARCHAR(1),
     isProximal boolean,

     conservation_signals real[],
     conservation_min real,
     conservation_max real,
     ctcf_zscores real[],
     ctcf_min real,
     ctcf_max real,
     dnase_zscores real[],
     dnase_min real,
     dnase_max real,
     enhancer_zscores real[],
     enhancer_min real,
     enhancer_max real,
     h3k27ac_zscores real[],
     h3k27ac_min real,
     h3k27ac_max real,
     h3k4me3_zscores real[],
     h3k4me3_min real,
     h3k4me3_max real,
     insulator_zscores real[],
     insulator_min real,
     insulator_max real,
     promoter_zscores real[],
     promoter_min real,
     promoter_max real,
     maxz real,
     rampage_zscores real[],

     gene_all_distance integer[],
     gene_all_id integer[],
     gene_pc_distance integer[],
     gene_pc_id integer[]
    ); """.format(tn=self.tableName_cre))

    def doImport(self, curs):
        print('***********', "create tables")
        for chrom in self.chroms:
            fn = chrom + ".tsv.gz"
            fnp = paths.fnpCreTsvs(self.assembly, fn)
            if self.sample:
                if "chr13" != chrom:
                    fnp = paths.fnpCreTsvs(self.assembly, "sample", fn)
            with gzip.open(fnp) as f:
                printt("importing", fnp, "into", self.tableName_cre)
                curs.copy_from(f, self.tableName_cre, '\t', columns=DB_COLS)

    def selectInto(self, curs):
        print('***********', "selecting into new table")
        curs.execute("""
        DROP TABLE IF EXISTS {ntn} CASCADE;

        SELECT *
        INTO {ntn}
        FROM {tn}
        ORDER BY maxZ, chrom, start;

        DROP TABLE {tn};
        """.format(tn=self.tableName_cre,
                   ntn=self.tableName_cre_all))

    def addCol(self):
        printt("adding col...")
        curs.execute("""
    ALTER TABLE {tn}
    ADD COLUMN creGroup integer;

    UPDATE {tn}
    SET ...
    """.format(tn=self.tableName_cre_all))


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        ic = ImportCREs(DBCONN, assembly, args.sample)
        if 1:
            ic.run()
        else:
            # example to show how to add and populate column to
            #  master and, by inheritance, children tables...
            ic.addCol()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--sample', action="store_true", default=False)
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    return run(args, DBCONN)


if __name__ == '__main__':
    sys.exit(main())

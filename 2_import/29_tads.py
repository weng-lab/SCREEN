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
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from get_tss import Genes
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, printWroteNumLines, printt

rootDir = os.path.join(Dirs.projects_base, "cREs")

class TADImporter:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def _import_biosamples(self):
        tableName = self.assembly + "_tad_biosamples"
        printt("dropping and creating", tableName)
        self.curs.execute("""
            DROP TABLE IF EXISTS {tableName};
            CREATE TABLE {tableName}
            (id serial PRIMARY KEY,
            acc TEXT, name TEXT);
        """.format(tableName=tableName))

        with open(os.path.join(rootDir, "%s/CTCF/tad_biosamples.tsv" % self.assembly), "r") as f:
            cols = ["acc", "name"]
            self.curs.copy_from(f, tableName, '\t', columns=cols)
        printt("imported", self.curs.rowcount)
        makeIndex(self.curs, tableName, ["acc", "name"])

    def _import_tads(self):
        tableName = self.assembly + "_all_tads"
        printt("dropping and creating", tableName)
        self.curs.execute("""
            DROP TABLE IF EXISTS {tableName};
            CREATE TABLE {tableName}
            (id serial PRIMARY KEY,
            acc TEXT, chrom TEXT, start INTEGER, stop INTEGER);
        """.format(tableName=tableName))
        with open(os.path.join(rootDir, "%s/CTCF/all_tads.tsv" % self.assembly), "r") as f:
            cols = ["acc", "chrom", "start", "stop"]
            self.curs.copy_from(f, tableName, '\t', columns=cols)
        printt("imported", self.curs.rowcount)
        makeIndex(self.curs, tableName, ["acc", "chrom"])

    def run(self):
        self._import_biosamples()
        self._import_tads()


def run(args, DBCONN):
    assemblies = ["hg19"]  # Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "29_tads") as curs:
            g = TADImporter(curs, assembly)
            g.run()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)

    return 0


if __name__ == '__main__':
    sys.exit(main())

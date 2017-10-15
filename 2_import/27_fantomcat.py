#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import json
import psycopg2
import re
import argparse
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths
from config import Config
from pgfantomcat import PGFantomCat

sys.path.append(os.path.join(os.path.dirname(__file__), '../1_screen_pipeline/06_fantomcat/'))
from fc_common import FCPaths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, printt


class FantomCatImport:
    def __init__(self, assembly):
        self.assembly = assembly
        self._db = PGFantomCat(assembly)

    def run(self, curs):
        self._db.drop_and_recreate(curs)
        self._db.import_genes_fromfile(FCPaths.forimport["genes"], curs)
        self._db.import_intersections_fromfile(FCPaths.forimport["intersections"], curs)
        self._db.import_intersections_fromfile(FCPaths.forimport["twokb_intersections"], curs, "twokb_intersections")


def run(args, DBCONN):
    assemblies = ["hg19"]
    if args.assembly:
        assemblies = [args.assembly]
    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "27_fantomcat$run") as curs:
            FantomCatImport(assembly).run(curs)


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

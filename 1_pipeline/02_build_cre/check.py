#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from exp import Exp
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, eprint, AddPath

AddPath(__file__, '../../common/')
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths

class CheckCellTypes:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def run(self):


zcat $1 | awk 'BEGIN {srand()} !/^$/ { if (rand() <= .01) print $0}' | gzip >  $DIR/sample/$FN


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = ["mm10", "hg19"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        with getcursor(DBCONN, "04_cellTypeInfo") as curs:
            ctt = CheckCellTypes(curs, assembly)
            ctt.run()

    return 0

if __name__ == '__main__':
    main()

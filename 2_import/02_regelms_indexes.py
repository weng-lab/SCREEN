#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect, db_connect_single
from constants import chroms, paths, DB_COLS
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils'))
from db_utils import getcursor, makeIndex, makeIndexArr, makeIndexIntRange, makeIndexInt4Range, vacumnAnalyze, makeIndexRev
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer

class CreateIndices:
    def __init__(self, assembly):
        self.chroms = chroms[assembly]
        self.tableName = assembly + "_cre_all"
        self.all_cols = DB_COLS
        self.zscore_cols = [x for x in self.all_cols if x.endswith("_zscore")]

    def vac(self):
        with db_connect_single(os.path.realpath(__file__)) as conn:
            vacumnAnalyze(conn, self.tableName, [])

    def run(self):
        tn = self.tableName
        with db_connect_single(os.path.realpath(__file__)) as conn:
            with conn.cursor() as curs:
                makeIndex(curs, tn, ["accession", "chrom"])
                #makeIndexInt4Range(curs, tn, ["start", "stop"])
                makeIndexRev(curs, tn, ["maxz", "dnase_max",
                                        "h3k4me3_max", "h3k27ac_max",
                                        "ctcf_max"])
                conn.commit()
                if 0:
                    for col in self.zscore_cols:
                        makeIndexArr(curs, tn, col, conn)

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        ci = CreateIndices(assembly)
        ci.run()
        ci.vac()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    return run(args, None)

if __name__ == '__main__':
    main()

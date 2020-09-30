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

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect, db_connect_single
from constants import chroms, paths, DB_COLS
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils'))
from db_utils import getcursor, makeIndex, makeIndexArr, makeIndexIntRange, makeIndexInt4Range, vacumnAnalyze, makeIndexRev
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer, printt


class CreateIndices:
    def __init__(self, assembly):
        self.assembly = assembly

    def run(self):
        with db_connect_single(os.path.realpath(__file__)) as conn:
            with conn.cursor() as curs:
                tn = "r_rnas_" + self.assembly
                makeIndex(curs, tn, ["celltype"])

                tn = "r_expression_" + self.assembly
                makeIndex(curs, tn, ["dataset"])

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        ci = CreateIndices(assembly)
        ci.run()


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

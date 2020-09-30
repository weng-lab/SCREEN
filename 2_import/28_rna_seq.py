#!/usr/bin/env python2

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function
import os
import sys
import argparse
from importlib import import_module

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, printt, AddPath

AddPath(__file__, '../common/')
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths
from config import Config
from pgfantomcat import PGFantomCat

AddPath(__file__, './rna_seq/')
rna1 = import_module('01_import_merged_tsv')
rna2 = import_module('02_metadata')


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]
    for assembly in assemblies:
        printt('***********', assembly)
        args.assembly = assembly
        rna1.run(args, DBCONN)
        rna2.run(args, DBCONN)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--index', action="store_true", default=False)
    args = parser.parse_args()
    return args


def main():
    args = parse_args()
    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)
    return 0


if __name__ == '__main__':
    sys.exit(main())

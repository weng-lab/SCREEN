#!/usr/bin/env python

from __future__ import print_function
import json
import sys
import os
import argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets
from db_utils import getcursor

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), "../website/models"))
from biosamples import BiosamplesMaker

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--version', type=int, default=7)
    parser.add_argument('--assembly', type=str, default="hg19")
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    with getcursor(DBCONN, "biosample") as curs:
        for assembly in ["hg19", "mm10"]:
            d = os.path.join(os.path.dirname(__file__), "../counts/")
            b = BiosamplesMaker(assembly, DBCONN, curs, d)
            b.run()
    return 0

if __name__ == "__main__":
    sys.exit(main())

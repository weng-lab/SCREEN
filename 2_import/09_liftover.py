#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs

def setupLiftover(curs, tableName):
    # chr8    56331232        56331315        MP-158-5.096910 MP-hg19-100-2294605     5
    curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}(
id serial PRIMARY KEY,
chrom text,
start integer,
stop integer,
mouseMPname text,
humanMPname text,
overlap integer
);
""".format(tableName = tableName))

def setupAll(curs):
    dataF = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/"
    dataF = os.path.join(dataF, "ver9/liftover/")
    fnp = os.path.join(dataF, "mm10-to-hg19-50.bed")
    tableName = "mm10_liftover"
    setupLiftover(curs, tableName)

    cols = "chrom start stop mouseMPname humanMPname overlap".split(' ')
    with open(fnp) as f:
        curs.copy_from(f, tableName, '\t', columns=cols)
    print("\tcopied in", fnp)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    with getcursor(DBCONN, "main") as curs:
        setupAll(curs)

if __name__ == '__main__':
    main()

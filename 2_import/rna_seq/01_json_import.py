#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import json
import psycopg2
import argparse
import gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect
from config import Config

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange, makeIndexMultiCol
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import AddPath, Utils, printt

AddPath(__file__, '../../common/')
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS
from config import Config


def setupAndCopy(cur, assembly, fnp):
    tableName = "r_expression_" + assembly

    printt("dropping and creating", tableName)
    cur.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName} (
id serial PRIMARY KEY,
ensembl_id VARCHAR(256) NOT NULL,
gene_name VARCHAR(256) NOT NULL,
dataset VARCHAR(256) NOT NULL,
fileID VARCHAR(256) NOT NULL,
replicate INT NOT NULL,
fpkm NUMERIC NOT NULL,
tpm NUMERIC NOT NULL);
    """.format(tableName=tableName))

    printt("importing", fnp)
    with gzip.open(fnp) as f:
        cur.copy_from(f, tableName, '\t',
                      columns=("dataset", "fileID", "ensembl_id", "gene_name",
                               "replicate", "tpm", "fpkm"))


def doIndex(curs, assembly):
    tableName = "r_expression_" + assembly
    makeIndex(curs, tableName, ["gene_name"])


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        fnp = paths.geFnp(assembly)

        with getcursor(DBCONN, "08_setup_log") as curs:
            if args.index:
                doIndex(curs, assembly)
            else:
                print("using", fnp)
                setupAndCopy(curs, assembly, fnp)
                doIndex(curs, assembly)


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

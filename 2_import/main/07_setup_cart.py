#!/usr/bin/env python

from __future__ import print_function

import os, sys, json, psycopg2, argparse, fileinput
import cStringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils, printWroteNumLines
from dbs import DBS
from metadataws import MetadataWS
from files_and_paths import Genome, Datasets

def setupCart(cur):
    tableName = "cart";
    print('\t', "dropping and creating", tableName)
    cur.execute("""
    DROP TABLE IF EXISTS {tableName};
    CREATE TABLE {tableName}
    (id serial PRIMARY KEY,
    uid text,
    re_accession text
    ) """.format(tableName = tableName))
    
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--process', action="store_true", default=True)
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--dump', action="store_true", default=False)
    parser.add_argument('--rebuild', action="store_true", default=False)
    parser.add_argument('--index', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    if args.local:
        dbs = DBS.localRegElmViz()
    else:
        dbs = DBS.pgdsn("RegElmViz")
    dbs["application_name"] = os.path.basename(__file__)

    with psycopg2.connect(**dbs) as conn:
        with conn.cursor() as cur:
            setupCart(cur)
            
if __name__ == '__main__':
    main()

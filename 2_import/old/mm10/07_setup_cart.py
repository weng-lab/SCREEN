#!/usr/bin/env python

from __future__ import print_function

import os, sys, json, psycopg2, argparse, fileinput
import cStringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../../metadata/utils/'))
from db_utils import getcursor

def setupCart(cur):
    tableName = "cart";
    print('\t', "dropping and creating", tableName)
    cur.execute("""
    DROP TABLE IF EXISTS {tableName};
    CREATE TABLE {tableName}
    (id serial PRIMARY KEY,
    uid text,
    re_accessions json,
    unique (uid)
    ) """.format(tableName = tableName))
    
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    with getcursor(DBCONN, "07_setup_cart") as curs:
        setupCart(curs)
            
if __name__ == '__main__':
    main()

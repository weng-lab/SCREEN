#!/usr/bin/env python

from __future__ import print_function

import os, sys, json, psycopg2, argparse, fileinput

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor
from utils import AddPath, printt

AddPath(__file__, '../common/')
from dbconnect import db_connect
from config import Config

def setupCart(cur, assembly):
    tableName = assembly + "_cart"

    print('\t', "dropping and creating", tableName)

    cur.execute("""
    DROP TABLE IF EXISTS {tn};
    CREATE TABLE {tn}
    (id serial PRIMARY KEY,
    uuid text,
    accessions jsonb,
    unique (uuid)
    ) """.format(tn = tableName))

def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = Config.assemblies
    for assembly in assemblies:
        with getcursor(DBCONN, "07_setup_cart") as curs:
            setupCart(curs, assembly)

if __name__ == '__main__':
    main()

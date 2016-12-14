#!/usr/bin/env python

import os, sys, json, psycopg2, argparse, cherrypy
import uuid

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../../common'))
from dbconnect import db_connect
from utils import Utils
from dbs import DBS
from db_utils import getcursor


def setupDB(DBCONN):
    table = "sessions"
    with getcursor(DBCONN, "get") as curs:
        curs.execute("""
DROP TABLE IF EXISTS {table};
CREATE TABLE {table}
(id serial PRIMARY KEY,
uid text,
session_id text
) """.format(table = table))

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for t in ["sessions"]:
        setupDB(DBCONN)

if __name__ == '__main__':
    main()

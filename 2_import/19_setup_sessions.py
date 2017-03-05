#!/usr/bin/env python

from __future__ import print_function

import os, sys, argparse

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor
from utils import AddPath, printt

AddPath(__file__, '../common/')
from dbconnect import db_connect
from config import Config

def setupDB(DBCONN):
    tableName = "sessions"
    printt("drop and create", tableName)
    with getcursor(DBCONN, "get") as curs:
        curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}
(id serial PRIMARY KEY,
uid text,
session_id text
) """.format(tn = tableName))

def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    setupDB(DBCONN)

if __name__ == '__main__':
    main()

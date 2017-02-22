#!/usr/bin/env python

from __future__ import print_function
import argparse
import sys
import os
import psycopg2

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor
from utils import AddPath

AddPath(__file__, '../common/')
from dbconnect import db_connect

def rename(DBCONN, oldDb, newDb):
    with getcursor(DBCONN, "pg") as curs:
        # http://stackoverflow.com/a/7678959
        curs.execute("""
SELECT pg_terminate_backend( pid )
FROM pg_stat_activity
WHERE pid <> pg_backend_pid( )
    AND datname = {oldDb};

ALTER DATABASE {oldDb} RENAME TO {newDb};
""".format(oldDb = oldDb, newDb = newDb))
        tables = [t[0] for t in curs.fetchall()]

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)

    return 0

if __name__ == '__main__':
    main()

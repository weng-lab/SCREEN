#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import argparse
import json

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor
from utils import AddPath, printt

AddPath(__file__, '../common/')
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper
from constants import helptext, paths

class HelpTextImport:
    def __init__(self, args, curs):
        self.args = args
        self.curs = curs

    def run(self):
        self._recreate_tables()
        self._import()

    def _import(self):
        fnp = paths.path('', "extras", "google-help-text.json")
        with open(fnp) as f:
            j = json.load(f)
        records_list_template = j["records_list_template"]
        rows = [tuple(r) for r in j["rows"]] # for psycopg2

        keys = [r[0] for r in rows]
        print('\n'.join(keys))

        # from http://stackoverflow.com/a/30985541
        q = """
INSERT INTO helpkeys (key, title, summary)
VALUES {}
""".format(records_list_template)

        self.curs.execute(q, rows)
        print("inserted", "{:,}".format(self.curs.rowcount), "help text items")
        
    def _recreate_tables(self):
        self.curs.execute("""
DROP TABLE IF EXISTS helpkeys;
CREATE TABLE helpkeys
( id serial PRIMARY KEY,
key text,
title text,
summary text
)""")

def run(args, DBCONN):
    printt('***********')
    with getcursor(DBCONN, "DB::recreate_tables") as curs:
        hti = HelpTextImport(args, curs)
        return hti.run()

def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    return run(args, DBCONN)
            
if __name__ == "__main__":
    sys.exit(main())

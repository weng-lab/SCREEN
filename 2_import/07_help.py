#!/usr/bin/env python

import os
import sys
import argparse
from oauth2client import tools

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor
from utils import AddPath

AddPath(__file__, '../common/')
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper
from constants import helptext

AddPath(__file__, "../googleapi")
from helptext import GoogleDocs

class DB:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN

    def recreate_tables(self):
        with getcursor(self.DBCONN, "DB::recreate_tables") as curs:
            curs.execute("""
DROP TABLE IF EXISTS helpkeys;
CREATE TABLE helpkeys
( id serial PRIMARY KEY,
key text,
title text,
summary text
)""")

    def insert_value(self, key, summary, title):
        with getcursor(self.DBCONN, "DB::insert_totals") as curs:
            curs.execute("""
INSERT INTO helpkeys (key, title, summary)
VALUES (%s, %s, %s)
""", (key, summary, title))

def parseargs():
    parser = argparse.ArgumentParser(parents = [tools.argparser])
    return parser.parse_args()

def main():
    args = parseargs()
    inserted = 0

    # connect to DB
    DBCONN = db_connect(os.path.realpath(__file__))
    db = DB(DBCONN)

    # download GoogleDoc
    _help_text = GoogleDocs(args).getcontents(helptext.docid).split("\n")

    # only reset DB if valid helptext was downloaded
    if len(_help_text) == 0:
        print("no help text could be downloaded; please check GoogleDoc contents at https://docs.google.com/document/d/%s" % helptext.docid)
        return 1
    db.recreate_tables()

    """
      " load from the cached Google Doc and parse
      " file format is:
      "
      " @key
      " # comment
      " %title
      " help_text
    """
    key = None
    help_text = ""
    title = ""

    keys = []

    for line in _help_text:
        if line.startswith('@'):
            if key and help_text:
                db.insert_value(key,
                                key if not title else title,
                                help_text.strip())
                inserted += 1
                keys.append(key)
            key = line.strip()[1:]
            help_text = ""
            title = ""
        elif line.startswith("%"):
            title = line.replace("%", "").strip()
        elif not line.startswith("#"):
            help_text += line.strip() + "\n"
    if key and help_text:
        db.insert_value(key,
                        key if not title else title,
                        help_text.strip())
        inserted += 1
        keys.append(key)

    print("inserted", inserted, "help text items")
    print('\n'.join(keys))
    return 0

if __name__ == "__main__":
    sys.exit(main())

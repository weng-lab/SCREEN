#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import argparse
from oauth2client import tools
import StringIO

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

class HelpTextImport:
    def __init__(self, args, curs):
        self.args = args
        self.curs = curs

    def run(self):
        # download GoogleDoc
        self.data = GoogleDocs(self.args).getcontents(helptext.docid).split("\n")

        # only reset DB if valid helptext was downloaded
        if len(self.data) == 0:
            print("no help text could be downloaded; please check GoogleDoc contents at https://docs.google.com/document/d/%s" % helptext.docid)
            return 1
        
        self._recreate_tables()
        self._parse()
        self._save()

    def _parse(self):
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

        rows = []
        for line in self.data:
            if line.startswith('@'):
                if key and help_text:
                    if not title:
                        print("error: missing title for", key)
                    rows.append((key, title, help_text.strip()))
                key = line.strip()[1:]
                help_text = ""
                title = ""
            elif line.startswith("%"):
                title = line.replace("%", "").strip()
            elif not line.startswith("#"):
                help_text += line.strip() + "\n"
        if key and help_text:
            if not title:
                print("error: missing title for", key)
            rows.append((key, title, help_text.strip()))

        self.rows = filter(lambda x: not x[0].startswith("key: a specific key"),
                           rows)

    def _save(self):
        keys = [r[0] for r in self.rows]
        print('\n'.join(keys))

        # from http://stackoverflow.com/a/30985541
        records_list_template = ','.join(['%s'] * len(self.rows))
        q = """
INSERT INTO helpkeys (key, title, summary)
VALUES  {}
""".format(records_list_template)

        self.curs.execute(q, self.rows)
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

def parseargs():
    parser = argparse.ArgumentParser(parents = [tools.argparser])
    return parser.parse_args()

def main():
    args = parseargs()
    inserted = 0

    # connect to DB
    DBCONN = db_connect(os.path.realpath(__file__))
    with getcursor(DBCONN, "DB::recreate_tables") as curs:
        hti = HelpTextImport(args, curs)
        ret = hti.run()
    return ret
    
if __name__ == "__main__":
    sys.exit(main())

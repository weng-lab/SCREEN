#!/usr/bin/env python

import os
import sys
import argparse

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../website/common"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../website"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../googleapi"))

from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper
from helptext import get_helptext

sys.path.append("../../../metadata/utils")
from db_utils import getcursor

class DB:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN

    def recreate_tables(self):
        with getcursor(self.DBCONN, "DB::recreate_tables") as curs:
            curs.execute("DROP TABLE IF EXISTS helpkeys")
            curs.execute("""CREATE TABLE helpkeys
                            ( id serial PRIMARY KEY,
                              key text, title text, summary text, link text )""")

    def insert_value(self, key, summary, title, link = ""):
        with getcursor(self.DBCONN, "DB::insert_totals") as curs:
            curs.execute("""INSERT INTO helpkeys (key, title, summary, link)
                                         VALUES (%(key)s, %(summary)s, %(title)s, %(link)s)""",
                         {"key": key, "summary": summary, "title": title, "link": link})
            
def parseargs():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    return parser.parse_args()

keymap = {"Activity Heatmap": "main_rank_heatmap"}

def main():
    args = parseargs()

    # connect to DB
    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    db = DB(DBCONN)

    # recreate tables
    db.recreate_tables()

    # just insert one test key for 
#    db.insert_value("main_rank_heatmap", "Activity Heatmap",
#                    """The activity heatmap displays the fraction of the search results which are active in each cell type by DNase, promoter, enhancer, and CTCF rank.\n
#                       An active element is defined as any element with a rank below the predefined threshold of 20,000.""")

    helptext = get_helptext().split("\n")
    key = None
    helptext = ""
    for line in helptext:
        if line.startswith("@"):
            if key and helptext and key in keymap:
                db.insert_value(keymap[key], key, helptext)
            key = line.strip()[1:]
            helptext = ""
        else:
            helptext += line
    
    return 0

if __name__ == "__main__":
    sys.exit(main())

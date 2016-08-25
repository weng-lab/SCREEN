#!/usr/bin/env python

import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from dbconnect import db_connect
from utils import Utils
from dbs import DBS
from db_utils import getcursor

class DbTrackhub:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN
        self.tableSearch = "search"

    def setupDB(self):
        with getcursor(self.DBCONN, "setupDB") as curs:
            curs.execute("""
DROP TABLE IF EXISTS {search};
CREATE TABLE {search}
(id serial PRIMARY KEY,
reAccession text,
assembly text,
uid text NOT NULL,
hubNum integer NOT NULL
) """.format(search = self.tableSearch))

    def get(self, uid):
        with getcursor(self.DBCONN, "get") as curs:
            curs.execute("""
SELECT reAccession, assembly, hubNum
FROM {search}
WHERE uid = %(uid)s
""".format(search = self.tableSearch), {"uid" : uid})
            row = curs.fetchone()
        if not row:
            return None
        return {"reAccession" : row[0],
                "assembly" : row[1],
                "hubNum" : row[2]}

    def insertOrUpdate(self, assembly, reAccession, uid):
        with getcursor(self.DBCONN, "insertOrUpdate") as curs:
            curs.execute("""
SELECT id FROM search
WHERE uid = %(uid)s
""", {"uid" : uid})
            if (curs.rowcount > 0):
                curs.execute("""
UPDATE search
SET
reAccession = %(reAccession)s,
assembly = %(assembly)s,
hubNum = hubNum + 1
WHERE uid = %(uid)s
RETURNING hubNum;
""", {"reAccession" : reAccession,
      "assembly" : assembly,
      "uid" : uid
})
                hubNum = curs.fetchone()[0]
            else:
                curs.execute("""
INSERT INTO search
                (reAccession, assembly, uid, hubNum)
VALUES (
%(reAccession)s,
%(assembly)s,
%(uid)s,
%(hubNum)s
) RETURNING hubNum;
""", {"reAccession" : reAccession,
      "assembly" : assembly,
      "uid" : uid,
      "hubNum" : 0
      })
                hubNum = curs.fetchone()[0]
        return hubNum

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    adb = DbTrackhub(DBCONN)
    adb.setupDB()

if __name__ == '__main__':
    main()

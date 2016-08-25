#!/usr/bin/env python

import os, sys, json, psycopg2, argparse, cherrypy
import uuid

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils
from dbs import DBS
from db_utils import getcursor

class Sessions:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN
        self.table = "sessions"

    def makeUid(self):
        return str(uuid.uuid4())

    def setupDB(self):
        with getcursor(self.DBCONN, "get") as curs:
            curs.execute("""
DROP TABLE IF EXISTS {table};
CREATE TABLE {table}
(id serial PRIMARY KEY,
uid text,
session_id text
) """.format(table = self.table))

    def insert(self, session_id, uid):
        with getcursor(self.DBCONN, "get") as curs:
            curs.execute("""
INSERT INTO {table}
(session_id, uid)
VALUES (
%(session_id)s,
%(uid)s
)""".format(table = self.table), {"session_id" : session_id,
       "uid" : uid
})

    def insertOrUpdate(self, session_id, uid):
        with getcursor(self.DBCONN, "insertOrUpdate") as curs:
            curs.execute("""
SELECT id FROM {table}
WHERE session_id = %(session_id)s
""".format(table = self.table), {"session_id" : session_id})
            if (curs.rowcount > 0):
                curs.execute("""
UPDATE {table}
SET
uid = %(uid)s
WHERE session_id = %(session_id)s
""".format(table = self.table), {"session_id" : session_id,
      "uid" : uid
})
            else:
                curs.execute("""
INSERT INTO {table}
(session_id, uid)
VALUES (
%(session_id)s,
%(uid)s
)""".format(table = self.table), {"session_id" : session_id,
       "uid" : uid
})

    def get(self, session_id):
        print(self.table)
        with getcursor(self.DBCONN, "get") as curs:
            curs.execute("""
SELECT uid
FROM {table}
WHERE session_id = %(session_id)s
""".format(table = self.table), {"session_id" : session_id})
            uid = curs.fetchone()
            if uid:
                return uid[0]
            return None

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    if args.local:
        dbs = DBS.localRegElmViz()
    else:
        dbs = DBS.pgdsn("RegElmViz")
    dbs["application_name"] = os.path.realpath(__file__)

    import psycopg2.pool
    DBCONN = psycopg2.pool.ThreadedConnectionPool(1, 32, **dbs)

    for t in ["sessions"]:
        s = Sessions(DBCONN)
        s.setupDB()

if __name__ == '__main__':
    main()

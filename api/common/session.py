#!/usr/bin/env python2

import os
import sys
import json
import psycopg2
import argparse
import cherrypy
import uuid

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
sys.path.append(os.path.join(os.path.dirname(__file__), '../../common'))
from dbconnect import db_connect
from utils import Utils
from dbs import DBS
from db_utils import getcursor


class Sessions:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN
        self.table = "sessions"

    def makeUid(self):
        return str(uuid.uuid4())

    def insert(self, session_id, uid):
        with getcursor(self.DBCONN, "get") as curs:
            curs.execute("""
INSERT INTO {table}
(session_id, uid)
VALUES (
%(session_id)s,
%(uid)s
)""".format(table=self.table), {"session_id": session_id,
                                "uid": uid
                                })

    def insertOrUpdate(self, session_id, uid):
        with getcursor(self.DBCONN, "insertOrUpdate") as curs:
            curs.execute("""
SELECT id FROM {table}
WHERE session_id = %(session_id)s
""".format(table=self.table), {"session_id": session_id})
            if (curs.rowcount > 0):
                curs.execute("""
UPDATE {table}
SET
uid = %(uid)s
WHERE session_id = %(session_id)s
""".format(table=self.table), {"session_id": session_id,
                               "uid": uid
                               })
            else:
                curs.execute("""
INSERT INTO {table}
(session_id, uid)
VALUES (
%(session_id)s,
%(uid)s
)""".format(table=self.table), {"session_id": session_id,
                                "uid": uid
                                })

    def userUid(self):
        # http://stackoverflow.com/a/28205729

        cherrypy.session.acquire_lock()

        sid = cherrypy.session.id
        uid = self.get(sid)
        if not uid:
            uid = self.makeUid()
            cherrypy.session["uid"] = uid
            sid = cherrypy.session.id
            self.insert(sid, uid)

        cherrypy.session.release_lock()
        return uid

    def get(self, session_id):
        print(self.table)
        with getcursor(self.DBCONN, "get") as curs:
            curs.execute("""
SELECT uid
FROM {table}
WHERE session_id = %(session_id)s
""".format(table=self.table), {"session_id": session_id})
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

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for t in ["sessions"]:
        s = Sessions(DBCONN)


if __name__ == '__main__':
    main()

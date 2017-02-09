#!/usr/bin/env python

import sys
import os
import gzip
import json
import constants

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from dbs import DBS
from db_utils import getcursor

from dbconnect import db_connect
from constants import chroms

class PostgresWrapper:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN

    def get_helpkey(self, key):
        with getcursor(self.DBCONN, "get_helpkey") as curs:
            curs.execute("""SELECT title, summary, link FROM helpkeys
                                                        WHERE key = %(key)s""",
                         {"key": key})
            r = curs.fetchall()
        return r[0] if r else None

    def logQuery(self, query, ret, ip):
        userQuery = query.get("userQuery", "")
        esIndex = query.get("index", "")

        numResults = -1
        if "results" in ret:
            if "results" in ret["results"]:
                numResults = ret["results"]["results"]["total"]

        with getcursor(self.DBCONN, "logQuery") as curs:
            curs.execute("""
            INSERT into query_logs(query, userQuery, esIndex, numResults, ip)
            VALUES (%(query)s, %(userQuery)s,
            %(esIndex)s, %(numResults)s, %(ip)s)""",
                         {"query" : json.dumps(query),
                          "userQuery" : userQuery,
                          "esIndex" : esIndex,
                          "numResults": numResults,
                          "ip" : ip})

    def getCart(self, guid):
        with getcursor(self.DBCONN, "getCart") as curs:
            curs.execute("""
            SELECT re_accessions
            FROM cart
            WHERE uid = %(uid)s
            """, {"uid": guid})
            r = curs.fetchall()
        if r:
            return r[0][0]
        return None

    def addToCart(self, uuid, reAccessions):
        with getcursor(self.DBCONN, "addToCart") as curs:
            curs.execute("""
            SELECT re_accessions
            FROM cart
            WHERE uid = %(uuid)s""",{"uuid": uuid})
            if (curs.rowcount > 0):
                curs.execute("""
                UPDATE cart
                SET (re_accessions) = (%(re_accessions)s)
                WHERE uid = %(uuid)s""",
                             {"uuid": uuid,
                              "re_accessions" : json.dumps(reAccessions)})
            else:
                curs.execute("""
                INSERT into cart(uid, re_accessions)
                VALUES (%(uuid)s, %(re_accessions)s)""",
                            {"uuid": uuid,
                             "re_accessions" : json.dumps(reAccessions)})
            return {"rows" : curs.rowcount}

def main():
    DBCONN = db_connect(os.path.realpath(__file__))
    ps = PostgresWrapper(DBCONN)

    import json
    uid = "test"
    j = {"a" : [1,2,3]}
    ps.addToCart(uid, json.dumps(j))
    print(ps.getCart(uid))

    j = {"b" : [5,6,7]}
    ps.addToCart(uid, json.dumps(j))
    print(ps.getCart(uid))

    print(ps.getCart("nocart"))

if __name__ == '__main__':
    sys.exit(main())

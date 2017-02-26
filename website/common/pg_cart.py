#!/usr/bin/env python

from __future__ import print_function
import sys
import os
import json
    
sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper

class PGcartWrapper:
    def __init__(self, pg):
        self.pgs = {
            "hg19" : PGcart(pg, "hg19"),
            "mm10" : PGcart(pg, "mm10")}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

class PGcart:
    def __init__(self, pg, assembly):
        self.pg = pg
        self.assembly = assembly

    def get(self, guid):
        with getcursor(self.pg.DBCONN, "getCart") as curs:
            curs.execute("""
            SELECT re_accessions
            FROM cart
            WHERE uid = %(uid)s
            """, {"uid": guid})
            r = curs.fetchall()
        if r:
            return r[0][0]
        return None

    def set(self, uuid, reAccessions):
        with getcursor(self.pg.DBCONN, "setCart") as curs:
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
            return {"status" : "ok"}

def main():
    DBCONN = db_connect(os.path.realpath(__file__))
    ps = PostgresWrapper(DBCONN)
    cart = PGcart(ps, "hg19")
    
    uid = "test"
    j = {"a" : [1,2,3]}
    cart.set(uid, json.dumps(j))
    print(cart.get(uid))

    j = {"b" : [5,6,7]}
    cart.set(uid, json.dumps(j))
    print(cart.get(uid))

    print(cart.get("nocart"))

    j = {"b" : []}
    cart.set(uid, json.dumps(j))
    print(cart.get(uid))
    
if __name__ == '__main__':
    sys.exit(main())

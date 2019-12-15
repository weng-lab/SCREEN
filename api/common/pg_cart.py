#!/usr/bin/env python3


import sys
import os
import json
from psycopg2.extras import Json

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from config import Config


class PGcartWrapper:
    def __init__(self, pw):
        self.assemblies = Config.assemblies
        self.pgs = {a: PGcart(pw, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]


class PGcart:
    def __init__(self, pw, assembly):
        self.pw = pw
        self.assembly = assembly
        self.tableName = assembly + "_cart"

    def get(self, uuid):
        rows = self.pw.fetchall("getCart", """
        SELECT accessions
        FROM {tn}
        WHERE uuid = %s
        """.format(tn=self.tableName),
                                (uuid,))
        if rows:
            return list(rows[0][0]) # FIXME?
        return None

    def set(self, uuid, accessions):
        accessions = list(accessions)
        rows = self.pw.fetchall("setCart", """
        SELECT accessions
        FROM {tn}
        WHERE uuid = %s
        """.format(tn=self.tableName),
                                (uuid,))
        
        if (len(rows) > 0):
            self.pw.update("setCart", """
            UPDATE {tn}
            SET accessions = %s
            WHERE uuid = %s
            """.format(tn=self.tableName),
                            (Json(accessions), uuid))
        else:
            self.pw.insert("setCart", """
            INSERT into {tn} (uuid, accessions)
            VALUES (%s, %s)
            """.format(tn=self.tableName),
                           (uuid, Json(accessions)))
        return {"status": "ok"}


def main():
    from dbconnect import db_connect
    DBCONN = db_connect(os.path.realpath(__file__))
    pw = PostgresWrapper(DBCONN)

    for assembly in ["hg19", "mm10"]:
        print("*************", assembly)
        cart = PGcart(pw, assembly)

        uuid = "test"
        j = {"a": [1, 2, 3]}
        cart.set(uuid, j)
        print(cart.get(uuid))

        j = {"b": [5, 6, 7]}
        cart.set(uuid, j)
        print(cart.get(uuid))

        print(cart.get("nocart"))

        j = {"b": []}
        cart.set(uuid, json.dumps(j))
        print(cart.get(uuid))


if __name__ == '__main__':
    sys.exit(main())

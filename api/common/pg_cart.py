#!/usr/bin/env python3


import sys
import os
import json
from psycopg2.extras import Json

sys.path.append(os.path.join(os.path.dirname(__file__), "../../utils"))
from db_utils import getcursor

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper
from config import Config


class PGcartWrapper:
    def __init__(self, pg):
        self.assemblies = Config.assemblies
        self.pgs = {a: PGcart(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]


class PGcart:
    def __init__(self, pg, assembly):
        self.pg = pg
        self.assembly = assembly
        self.tableName = assembly + "_cart"

    def get(self, uuid):
        with getcursor(self.pg.DBCONN, "getCart") as curs:
            curs.execute("""
            SELECT accessions
            FROM {tn}
            WHERE uuid = %s
            """.format(tn=self.tableName), (uuid,))
            r = curs.fetchall()
        if r:
            return list(r[0][0])
        return None

    def set(self, uuid, accessions):
        accessions = list(accessions)
        with getcursor(self.pg.DBCONN, "setCart") as curs:
            curs.execute("""
            SELECT accessions
            FROM {tn}
            WHERE uuid = %s
            """.format(tn=self.tableName), (uuid,))

            if (curs.rowcount > 0):
                curs.execute("""
                UPDATE {tn}
                SET accessions = %s
                WHERE uuid = %s
                """.format(tn=self.tableName), (Json(accessions), uuid))
            else:
                curs.execute("""
                INSERT into {tn} (uuid, accessions)
                VALUES (%s, %s)
                """.format(tn=self.tableName), (uuid, Json(accessions)))
        return {"status": "ok"}


def main():
    DBCONN = db_connect(os.path.realpath(__file__))
    ps = PostgresWrapper(DBCONN)

    for assembly in ["hg19", "mm10"]:
        print("*************", assembly)
        cart = PGcart(ps, assembly)

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

#!/usr/bin/env python

import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
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
assembly text,
assays text,
tissues text,
loci text,
uid text NOT NULL,
assayType integer NOT NULL,
hubNum integer NOT NULL
) """.format(search = self.tableSearch))

    def get(self, uid):
        with getcursor(self.DBCONN, "get") as curs:
            curs.execute("""
SELECT assembly, assays, tissues, loci, assayType, hubNum
FROM {search}
WHERE uid = %(uid)s
""".format(search = self.tableSearch), {"uid" : uid})
            row = curs.fetchone()
        if not row:
            return None
        return {"assembly" : row[0],
                "assays" : row[1],
                "tissues" : row[2],
                "loci" : row[3],
                "assayType" : row[4],
                "hubNum" : row[5]}

    def insertOrUpdate(self, assayType, assembly, assays, tissues, loci, uid):
        with getcursor(self.DBCONN, "insertOrUpdate") as curs:
            curs.execute("""
SELECT id FROM search
WHERE uid = %(uid)s
""", {"uid" : uid})
            if (curs.rowcount > 0):
                curs.execute("""
UPDATE search
SET
assembly = %(assembly)s,
assays = %(assays)s,
tissues = %(tissues)s,
loci = %(loci)s,
assayType = %(assayType)s,
hubNum = hubNum + 1
WHERE uid = %(uid)s
RETURNING hubNum;
""", {"assembly" : assembly,
      "assays" : assays,
      "tissues" : json.dumps(tissues),
      "loci" : loci,
      "uid" : uid,
      "assayType" : assayType
})
                hubNum = curs.fetchone()[0]
            else:
                curs.execute("""
INSERT INTO search
(assembly, assays, tissues, loci, uid, assayType, hubNum)
VALUES (
%(assembly)s,
%(assays)s,
%(tissues)s,
%(loci)s,
%(uid)s,
%(assayType)s,
%(hubNum)s
) RETURNING hubNum;
""", {"assembly" : assembly,
      "assays" : assays,
      "tissues" : json.dumps(tissues),
      "loci" : loci,
      "uid" : uid,
      "assayType" : assayType,
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

    if args.local:
        dbs = DBS.localRegElmViz()
    else:
        dbs = DBS.pgdsn("RegElmViz")
    dbs["application_name"] = os.path.realpath(__file__)

    import psycopg2.pool
    DBCONN = psycopg2.pool.ThreadedConnectionPool(1, 32, **dbs)

    adb = DbTrackhub(DBCONN)
    adb.setupDB()

if __name__ == '__main__':
    main()

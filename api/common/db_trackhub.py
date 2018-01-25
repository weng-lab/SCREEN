#!/usr/bin/env python2

import os
import sys
import json
import psycopg2
import argparse

from psycopg2.extras import Json

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

    def get(self, uid):
        with getcursor(self.DBCONN, "get") as curs:
            curs.execute("""
            SELECT reAccession, assembly, hubNum, j
FROM {search}
WHERE uid = %(uid)s
""".format(search=self.tableSearch), {"uid": uid})
            row = curs.fetchone()
        if not row:
            return None
        return {"reAccession": row[0],
                "assembly": row[1],
                "hubNum": row[2],
                "j": row[3]}

    def insertOrUpdate(self, assembly, reAccession, uid, j):
        with getcursor(self.DBCONN, "insertOrUpdate") as curs:
            curs.execute("""
SELECT id FROM search
WHERE uid = %(uid)s
""", {"uid": uid})
            if (curs.rowcount > 0):
                curs.execute("""
UPDATE search
SET
reAccession = %(reAccession)s,
assembly = %(assembly)s,
hubNum = hubNum + 1,
j = %(j)s
WHERE uid = %(uid)s
RETURNING hubNum;
""", {"reAccession": reAccession,
                    "assembly": assembly,
                    "uid": uid,
                    "j": Json(j)
      })
                hubNum = curs.fetchone()[0]
            else:
                curs.execute("""
INSERT INTO search
                (reAccession, assembly, uid, hubNum, j)
VALUES (
%(reAccession)s,
%(assembly)s,
%(uid)s,
%(hubNum)s,
%(j)s
) RETURNING hubNum;
""", {"reAccession": reAccession,
                    "assembly": assembly,
                    "uid": uid,
                    "hubNum": 0,
                    "j": Json(j)
      })
                hubNum = curs.fetchone()[0]
        return hubNum

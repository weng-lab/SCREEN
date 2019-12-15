#!/usr/bin/env python3

import os
import sys
import json
import psycopg2
import argparse
from psycopg2.extras import Json

class DbTrackhub:
    def __init__(self, pw):
        self.pw = pw
        self.tableSearch = "search"

    def get(self, uid):
        row = self.pw.fetchone("db_trackhub$get", """
        SELECT reAccession, assembly, hubNum, j
        FROM {search}
        WHERE uid = %(uid)s
        """.format(search=self.tableSearch), {"uid": uid})

        if not row:
            return None
        return {"reAccession": row[0],
                "assembly": row[1],
                "hubNum": row[2],
                "j": row[3]}

    def insertOrUpdate(self, assembly, reAccession, uid, j):
        num = self.pw.rowcount("insertOrUpdate", """
        SELECT id FROM search
        WHERE uid = %(uid)s
        """, {"uid": uid})
        if num > 0:
            r = self.pw.updateReturning("insertOrUpdate", """
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
            hubNum = r[0]
            return hubNum
        
        r = self.pw.insertReturning("insertOrUpdate", """
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
        hubNum = r[0]
        return hubNum

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
            curs.execute("""
SELECT title, summary, link 
FROM helpkeys
WHERE key = %(key)s
""", {"key": key})
            r = curs.fetchall()
        return r[0] if r else None


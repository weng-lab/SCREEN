#!/usr/bin/env python

import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils
from dbs import DBS
from files_and_paths import Dirs
from db_utils import getcursor

class dbSnps:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN
        self.tableNames = {"mm10" : "dbsnps_mm10",
                           "hg19" : "dbsnps_hg19"}

    def lookup(self, assembly, rs):
        with getcursor(self.DBCONN, "lookup") as curs:
            curs.execute("""
SELECT chrom, chromStart, chromEnd FROM {table}
WHERE name = %(rs)s
""".format(table=self.tableNames[assembly]),
                             {"rs" : rs})
            if (curs.rowcount > 0):
                return curs.fetchall()
            return None

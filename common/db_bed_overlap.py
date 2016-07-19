#!/usr/bin/env python

import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from dbs import DBS
from db_utils import getcursor

class DbBedOverlap:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN

    def findBedOverlap(self, assembly, chrom, start, end):
        if assembly not in ["hg19", "mm10"]:
            return []
        with getcursor(self.DBCONN, "findBedOverlap") as curs:
            curs.execute("""
SELECT DISTINCT expID
FROM bedRanges{assembly}
WHERE chrom = %(chrom)s
AND startend && int4range(%(start)s, %(end)s)
""".format(assembly=assembly),
{"chrom" : chrom,
 "start" : start,
 "end" : end})
            return [x[0] for x in curs.fetchall()]

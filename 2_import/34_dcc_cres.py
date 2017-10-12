#!/usr/bin/env python

from __future__ import print_function

import os
import sys
import gzip
import argparse
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils, eprint, AddPath, printt
from querydcc import QueryDCC
from cache_memcache import MemCacheWrapper

AddPath(__file__, '../common/')
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from dbconnect import db_connect
from constants import paths
from config import Config

class DCCCres:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = self.assembly + "_dcc_cres"

    def run(self):
        self._import()
        self._doIndex()

    def _import(self):
        url = "https://www.encodeproject.org/search/?type=Annotation&encyclopedia_version=4"
        url += "&files.file_type=bigBed+bed3%2B&assembly=" + self.assembly
        url += "&format=json&limit=all"

        mc = MemCacheWrapper()
        qd = QueryDCC(cache=mc)

        for exp in qd.getExps(url):
            for f in exp.files:
                if not f.isBigBed():
                    continue
                print(f.alias)
        
        printt('***********', "drop and create", self.tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
celltype text,
dcc_accession text
);""".format(tableName = self.tableName))

        printt('***********', "import links")
        fnp = paths.path(self.assembly, "Gene-Links.v0.txt.gz")

        with gzip.open(fnp, "r") as f:
            cols = ["cre", "gene", "celltype", "method", "dccaccession"]
            self.curs.copy_from(f, self.tableName, '\t', columns=cols)
        printt("imported", self.curs.rowcount, "rows", self.tableName)

    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["celltype"])
   
def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "31_links") as curs:
            c = DCCCres(curs, assembly)
            c.run()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)
        
    return 0

if __name__ == "__main__":
    sys.exit(main())

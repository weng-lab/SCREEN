#!/usr/bin/env python

from __future__ import print_function

import os
import sys
import gzip
import argparse
import json
import re
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils, eprint, AddPath, printt
from querydcc import QueryDCC
from cache_memcache import MemCacheWrapper

AddPath(__file__, '../common/')
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from dbconnect import db_connect
from constants import paths
from config import Config
from exp import Exp

class OntologyToCellTypes:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = self.assembly + "_ontology_lookup"

    def run(self):
        self._import()
        self._doIndex()

    def _import(self):
        lookup = []

        mc = MemCacheWrapper("localhost")
        qd = QueryDCC(auth=False, cache=mc)

        fnp = paths.path(self.assembly, self.assembly + "-Look-Up-Matrix.txt")
        printt("parsing", fnp)
        with open(fnp) as f:
            for line in f:
                toks = line.strip().split('\t')
                ct = toks[0]
                for fileID in toks[2:]:
                    fileID= fileID.strip()                    
                    if not fileID or 'NA' == fileID:
                        continue
                    exp = qd.getExpFromFileID(fileID)
                    bsi = exp.jsondata.get("biosample_term_id", [])
                    if not bsi:
                        printt(expID, "missing biosample_term_id")
                    if not isinstance(bsi, list):
                        bsi = [bsi]
                    for i in bsi:
                        lookup.append([ct, i])
                    
        printt('***********', "drop and create", self.tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
celltype text,
biosample_term_id text,
synonyms jsonb
);""".format(tableName=self.tableName))

        printt('***********', "import lookup")
        printt("rewrite rows")
        outF = StringIO.StringIO()
        for r in lookup:
            outF.write('\t'.join(r) + '\n')
        outF.seek(0)

        cols = ["celltype", "biosample_term_id"]
        self.curs.copy_from(outF, self.tableName, '\t', columns=cols)
        print("copied in", self.curs.rowcount)

    def _addOntology(self):
        self.curs.execute("""
            UPDATE {tn}
    SET synonyms 
    """.format(tn=self.tableName))

        
    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["celltype", "biosample_term_id"])


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "31_links") as curs:
            c = OntologyToCellTypes(curs, assembly)
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

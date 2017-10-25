#!/usr/bin/env python

from __future__ import print_function

import os
import sys
import gzip
import argparse
import json
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils, eprint, AddPath, printt

AddPath(__file__, '../common/')
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from dbconnect import db_connect
from constants import paths
from config import Config


class Links:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = self.assembly + "_ontology"

    def run(self):
        self._import()
        self._doIndex()

    def _import(self):
        printt('***********', "drop and create", self.tableName)

        # "AEO:0001021": {
        #                 "assay": [],
        #                 "category": [],
        #                 "developmental": [],
        #                 "name": "stem cell population",
        #                 "objectives": [],
        #                 "organs": [],
        #                 "part_of": [],
        #                 "preferred_name": "",
        #                 "slims": [],
        #                 "synonyms": [],
        #                 "systems": [],
        #                 "types": []
        #             },
        
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
oid text,
info jsonb
);""".format(tableName=self.tableName))

        printt('***********', "import links")
        downloadDate = '2017-10Oct-25'
        fnp = paths.path("ontology", downloadDate, "ontology.json.gz")

        outF = StringIO.StringIO()
        with gzip.open(fnp, "rb") as f:
            kv = json.load(f)
        for k, v in kv.iteritems():
            outF.write('\t'.join(k, json.dumps(v)) + '\n')
        outF.seek(0)
        
        cols = ["oid", "info"]
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        printt("imported", self.curs.rowcount, "rows", self.tableName)

    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["oid"])


def run(args, DBCONN):
    assemblies = ["hg19"]  # Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "31_links") as curs:
            c = Links(curs, assembly)
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

#!/usr/bin/env python2

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function
import os
import sys
import argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import printt
from db_utils import getcursor, makeIndex

class ImportVISTA:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_vista"

    def setupTable(self):
        printt("dropping and creating table", self.tableName)
        self.curs.execute("""
 DROP TABLE IF EXISTS {tableName};
 CREATE TABLE {tableName}(
 id serial PRIMARY KEY,
 accession VARCHAR(20),
 vistaids VARCHAR(100)
);
    """.format(tableName=self.tableName))

    def run(self):
        self.setupTable()
        fnp = paths.path(self.assembly, "raw", "vista.tsv")
        printt("reading", fnp)
        with open(fnp) as f:
            self.curs.copy_from(f, self.tableName, '\t',
                                columns=("accession", "vistaids"))
        printt("copied in %d vista entries" % self.curs.rowcount)

    def index(self):
        makeIndex(self.curs, self.tableName, ["accession"])

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "main") as curs:
            ipi = ImportVISTA(curs, assembly)
            ipi.run()
            ipi.index()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()
    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)

if __name__ == '__main__':
    main()

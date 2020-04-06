#!/usr/bin/env python2

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


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


class DCCCres:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = self.assembly + "_dcc_cres_beds"

    def run(self):
        self._import()
        self._doIndex()

    def _import(self):
        url = "https://www.encodeproject.org/search/?type=Annotation&encyclopedia_version=4"
        url += "&files.file_type=bed+bed3%2B&assembly=" + self.assembly
        url += "&format=json&limit=all"

        mc = None
        if Config.memcache:
            mc = MemCacheWrapper(Config.memcache)
        qd = QueryDCC(auth=False, cache=mc)

        fnp = paths.path(self.assembly, self.assembly + "-Look-Up-Matrix.txt")
        printt("parsing", fnp)
        btidToCt = {}
        with open(fnp) as f:
            for line in f:
                line = line.strip().split('\t')
                btid = re.sub('[^0-9a-zA-Z]+', '-', line[0])
                btidToCt[btid] = line[0]
        printt("looking up ENCODE accessions...")
        rows = []
        for exp in qd.getExps(url):
            for f in exp.files:
                if not f.isBed():
                    continue
                # [u'zhiping-weng:cREs-hg19-v10-ganglionic...-5group-bigBed',
                #  u'zhiping-weng:cREs-hg19-v10-ganglionic-...-9state-H3K4me3-bigBed']
                aliases = f.jsondata["aliases"]
                typs = ["5group", "9state-H3K4me3", "9state-DNase",
                        "9state-H3K27ac", "9state-CTCF"]
                for a in aliases:
                    a = a.replace("zhiping-weng:cREs-" + self.assembly + "-v10-", '')
                    a = a.replace("-bed", '')
                    for t in typs:
                        if t in a:
                            ct = a.replace(t, '')[:-1]  # remove trailing hyphen
                            if not ct:
                                rows.append(["_agnostic", str(f.fileID), t])
                                continue
                            if ct not in btidToCt:
                                raise Exception("missing " + ct)
                            rows.append([btidToCt[ct], str(f.fileID), t])

        printt('***********', "drop and create", self.tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
celltype text,
dcc_accession text,
typ text
);""".format(tableName=self.tableName))

        printt('***********', "import ENCODE files")
        printt("rewrite rows")
        outF = StringIO.StringIO()
        for r in rows:
            outF.write('\t'.join(r) + '\n')
        outF.seek(0)

        cols = ["celltype", "dcc_accession", "typ"]
        self.curs.copy_from(outF, self.tableName, '\t', columns=cols)
        print("copied in", self.curs.rowcount)

    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["celltype"])


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "38_beds") as curs:
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

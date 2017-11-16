#!/usr/bin/env python2

from __future__ import print_function
import os
import sys
import json
import psycopg2
import re
import argparse
import gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt, printWroteNumLines
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from files_and_paths import Dirs, Tools, Genome, Datasets
from exp import Exp
from querydcc import QueryDCC
from cache_memcache import MemCacheWrapper
from metadataws import MetadataWS

AddPath(__file__, '../common/')
from dbconnect import db_connect, db_connect_single
from constants import chroms, paths, DB_COLS
from config import Config

AddPath(__file__, '../api/common/')
from pg_common import PGcommon
from pg import PGsearch
from postgres_wrapper import PostgresWrapper


class MoreTracks:
    def __init__(self, curs, assembly, pg):
        self.curs = curs
        self.assembly = assembly
        self.pg = pg
        self.pgSearch = PGsearch(pg, assembly)
        self.tableName = assembly + "_more_tracks"

    def run(self):
        self._setupTable()
        self._doImport()
        # self._doIndex()

    def _setupTable(self):
        printt("drop and create", self.tableName)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};
        CREATE TABLE {tn}
        (id serial PRIMARY KEY,
        cellTypeName text,
        tracks jsonb
        );""".format(tn=self.tableName))

    def _doImport(self):
        mc = MemCacheWrapper(Config.memcache)
        qd = QueryDCC(auth=False, cache=mc)

        m = MetadataWS.byAssembly(self.assembly)
        allExps = m.all_bigBeds_bigWigs(self.assembly)
        printt("found", len(allExps))

        ret = {}
        ns = self.pgSearch.loadNineStateGenomeBrowser()
        total = len(ns)
        counter = 1
        for ctn, v in ns.iteritems():
            printt(counter, 'of', total, ctn)
            counter += 1
            btns = set()
            for fileID in [v["dnase"], v["h3k4me3"], v["h3k27ac"], v["ctcf"]]:
                if 'NA' == fileID:
                    continue
                exp = qd.getExpFromFileID(fileID)
                btns.add(exp.biosample_term_name)

            exps = filter(lambda e: e.biosample_term_name in btns, allExps)
            ret[ctn] = []
            for e in exps:
                q = {"expID": e.encodeID,
                     "assay_term_name": e.assay_term_name,
                     "target": e.target,
                     "tf": e.tf,
                     "bigWigs": [{"fileID": f.fileID, "techRep": f.technical_replicates}
                                 for f in e.files if f.isBigWig()],
                     "beds": [{"fileID": f.fileID, "techRep": f.technical_replicates}
                              for f in e.files if f.isBigBed()]}
                ret[ctn].append(q)

            ret[ctn] = sorted(ret[ctn], key=lambda q: (q["assay_term_name"],
                                                       q["target"],
                                                       q["tf"]))
            self.curs.execute("""
            INSERT INTO {tableName} (cellTypeName, tracks)
VALUES (%s, %s)""".format(tableName=self.tableName),
                (ctn, json.dumps(ret[ctn])))

    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["cellTypeName", "cellTypeDesc"])


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        pg = PostgresWrapper(DBCONN)
        with getcursor(DBCONN, "dropTables") as curs:
            icg = MoreTracks(curs, assembly, pg)
            icg.run()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    return run(args, DBCONN)


if __name__ == '__main__':
    sys.exit(main())

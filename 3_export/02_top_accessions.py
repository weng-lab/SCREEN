#!/usr/bin/env python

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

AddPath(__file__, '../common/')
from dbconnect import db_connect, db_connect_single
from constants import chroms, paths, DB_COLS
from config import Config

AddPath(__file__, '../website/common/')
from pg_common import PGcommon
from postgres_wrapper import PostgresWrapper


class TopAccessions:
    def __init__(self, curs, assembly, pg):
        self.curs = curs
        self.assembly = assembly
        self.pg = pg

        self.pgc = PGcommon(self.pg, self.assembly)
        self.ctmap = self.pgc.makeCtMap()

    def run(self):
        self._makeFile("promoter", "Promoter")
        self._makeFile("insulator", "Insulator")
        self._makeFile("enhancer", "Enhancer")

    def _makeFile(self, assay, title):
        print("********************", title)
        self.assaymap = {assay: self.pgc.datasets_multi(assay)}
        cts = sorted(list(set(self.assaymap[assay].keys())))

        for ct in cts:
            print(ct)
            cti = self.ctmap[title][ct]
            self.curs.execute("""
            SELECT accession, {assay}_zscores[{cti}], chrom, start, stop
            FROM {tn}
            WHERE {assay}_zscores[{cti}] > 1.64
            ORDER BY 2 DESC
            """.format(assay=assay, cti=cti, tn=self.assembly + "_cre_all"))

            rows = self.curs.fetchall()
            ctSan = "".join(x for x in ct if x.isalnum() or x == '_')
            dnase_expID = self.assaymap[assay][ct]["dnase_expid"]
            other_expID = self.assaymap[assay][ct]["other_expid"]
            outFnp = paths.path(self.assembly, "export", assay + "-like",
                                '_'.join([ctSan, dnase_expID, other_expID])
                                + ".tsv")
            Utils.ensureDir(outFnp)
            with open(outFnp, 'w') as outF:
                for r in rows:
                    toks = [r[2], r[3], r[4], r[0], r[1]]
                    outF.write('\t'.join([str(s) for s in toks]) + '\n')
            printWroteNumLines(outFnp)


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        pg = PostgresWrapper(DBCONN)
        with getcursor(DBCONN, "dropTables") as curs:
            icg = TopAccessions(curs, assembly, pg)
            icg.run()

        with db_connect_single(os.path.realpath(__file__)) as conn:
            if 0:
                vacumnAnalyze(conn, assembly + "_cre_all", [])


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
    main()

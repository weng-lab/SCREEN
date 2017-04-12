#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip
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

class Concordant:
    def __init__(self, curs, assembly, pg):
        self.curs = curs
        self.assembly = assembly
        self.pg = pg
        self.tableName = assembly + "_concordant"
        self.tableNameCts = assembly + "_cre_groups_cts"
        self.outFnp = paths.path(self.assembly, "extras", "concordant.tsv.gz")

        self.pgc = PGcommon(self.pg, self.assembly)
        self.ctmap = self.pgc.makeCtMap()

    def run(self):
        with gzip.open(self.outFnp, 'w') as outF:
            self._makeFile(outF)
        printWroteNumLines(self.outFnp)

    def _makeFile(self, outF):
        printt("getting biosamples")
        self.assaymap = {"dnase": self.pgc.datasets("DNase"),
                         "h3k27ac": self.pgc.datasets("H3K27ac"),
                         "h3k4me3": self.pgc.datasets("H3K4me3"),
                         "ctcf" : self.pgc.datasets("CTCF")}
        dnase = set(self.assaymap["dnase"].keys())
        h27ac = dnase.intersection(set(self.assaymap["h3k27ac"].keys()))
        h4me3 = dnase.intersection(set(self.assaymap["h3k4me3"].keys()))
        cts = sorted(list(h27ac.union(h4me3)))

        outF.write('\t'.join(["accession"] + cts) + '\n')

        printt("loading data from cRE table...")
        self.curs.execute("""
        SELECT accession, dnase_zscores, h3k27ac_zscores, h3k4me3_zscores
        FROM {tn}
        """.format(tn = self.assembly + "_cre_all"))

        printt("marking concordant...")
        for r in self.curs.fetchall():
            accession = r[0]
            dnase_zscores = r[1]
            h3k27ac_zscores = r[2]
            h3k4me3_zscores = r[3]
            ret = ["0"] * len(cts)
            for cidx, ct in enumerate(cts):
                cti = self.ctmap["dnase"][ct] - 1
                dnasez = dnase_zscores[cti]
                if dnasez < 1.64:
                    continue
                if ct in h27ac:
                    cti = self.ctmap["enhancer"][ct] - 1 # 1-based
                    zs = h3k27ac_zscores[cti]
                    if zs >= 1.64:
                        ret[cidx] = "1"
                        continue
                if ct in h4me3:
                    cti = self.ctmap["promoter"][ct] - 1 # 1-based
                    zs = h3k4me3_zscores[cti]
                    if zs >= 1.64:
                        ret[cidx] = "1"
            outF.write('\t'.join([accession] + ret) + '\n')
        
def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print('***********', assembly)
        pg = PostgresWrapper(DBCONN)
        with getcursor(DBCONN, "dropTables") as curs:
            icg = Concordant(curs, assembly, pg)
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

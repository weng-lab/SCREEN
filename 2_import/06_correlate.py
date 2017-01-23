#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer
from get_yes_no import GetYesNoToQuestion

class Correlate:

    def __init__(self, DBCONN, assembly):
        self.DBCONN = DBCONN
        self.tableName = assembly + "_correlations"

    def exportTable(self, fnp):
        print("exporting CSV to", fnp)
        with getcursor(self.DBCONN, "Correlate::exportTable") as curs:
            with gzip.open(fnp, 'wb') as f:
                curs.copy_to(f, self.tableName, '\t',
                             columns = ["assay", "correlations"])

    def importTable(self, fnp):
        self.setupTable()
        with getcursor(self.DBCONN, "Correlate::importTable") as curs:
            with gzip.open(fnp) as f:
                curs.copy_from(f, self.tableName, '\t',
                               columns = ["assay", "correlations"])

    def setupTable(self):
        print("dropping and creating", self.tableName, "...")
        with getcursor(self.DBCONN, "Correlate::setupTable") as curs:
            curs.execute("""
            DROP TABLE IF EXISTS {tableName};
            CREATE TABLE {tableName}
            (id serial PRIMARY KEY,
            assay VARCHAR(20),
            correlations double precision[][]);""".format(tableName = self.tableName))

    def insertmatrix(self, assay, matrix):
        print("inserting %s to table %s" % (assay, self.tableName))
        with getcursor(self.DBCONN, "Correlate::insertmatrix") as curs:
            curs.execute("""
INSERT INTO {tableName} (assay, correlations)
            VALUES (%(assay)s, %(corrs)s)
            """.format(tableName = self.tableName), {"assay": assay, "corrs": matrix})

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--exportTable', action="store_true", default=False)
    parser.add_argument('--importTable', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def loadmatrix(fnp):
    r = []
    with open(fnp, "r") as f:
        for line in f:
            r.append([float(x) for x in line.rstrip().split(',')])
    return r

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    assemblies = ["mm10", "hg19"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print("working with assembly %s" % assembly)
        c = Correlate(DBCONN, assembly)
        if args.exportTable:
            c.exportTable(fnp)
        elif args.importTable:
            c.setupTable()
            c.importTable(fnp)
        else:
            c.setupTable()
            d = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/%s/mat" % assembly
            for assay in ["DNase", "H3K27ac", "H3K4me3", "Enhancer",
                          "Promoter", "Insulator", "CTCF"]:
                fnp = os.path.join(d, "%s-List.txt.cormat.txt" % assay)
                if not os.path.exists(fnp):
                    print("WARNING: missing matrix for assay %s; skipping" % fnp)
                    continue
                try:
                    matrix = loadmatrix(fnp)
                    c.insertmatrix(assay + "_v10", matrix)
                except:
                    print("error in", fnp)
                    raise
    return 0

if __name__ == '__main__':
    main()

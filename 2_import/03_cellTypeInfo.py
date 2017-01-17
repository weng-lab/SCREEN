#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils

class ImportCellTypeInfo:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def importRankIndexes(self):
        d = os.path.join("/project/umw_zhiping_weng/0_metadata/encyclopedia/",
                         "Version-4", "ver9", self.assembly, "newway")
        fnp = os.path.join(d, "parsed.cellTypeIndexes.chrY.tsv")
        tableName = self.assembly + "_rankCellTypeIndexex"
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
rankMethod text,
cellType text,
idx integer);""".format(tableName = tableName))

        cols = ["rankMethod", "cellType", "idx"]
        with open(fnp) as f:
            print("importing", fnp, "into", tableName)
            self.curs.copy_from(f, tableName, '\t', columns=cols)

    def run(self):
        self.importRankIndexes()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for assembly in ["hg19", "mm10"]:
        with getcursor(DBCONN, "3_cellTypeInfo") as curs:
            pd = ImportCellTypeInfo(curs, assembly)
            pd.run()

    return 0

if __name__ == '__main__':
    main()

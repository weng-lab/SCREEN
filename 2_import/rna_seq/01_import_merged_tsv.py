#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import json
import psycopg2
import argparse
import gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect
from config import Config

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange, makeIndexMultiCol
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import AddPath, Utils, printt, importedNumRows

AddPath(__file__, '../../common/')
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS
from config import Config

class ImportRNAseq(object):
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def _tableNameData(self, isNormalized):
        tableNameData = self.assembly + "_rnaseq_expression"
        if isNormalized:
            tableNameData += "_norm"
        else:
            tableNameData += "_unnorm"
        return tableNameData

    def _tableNameMetadata(self):
        return self.assembly + "_rnaseq_expression"

    def run(self):
        for isNormalized in [True, False]:
            tableNameData = self._tableNameData(isNormalized)
            fnp = paths.geFnp(self.assembly, isNormalized)
            self._setupAndCopy(tableNameData, fnp)
            self._doIndexData(tableNameData)

        # normalizaed and unnormalizaed tables should have same experiments!!
        self._extractExpIDs(tableNameData, self._tableNameMetadata())

    def _setupAndCopy(self, tableNameData, fnp):
        printt("dropping and creating", tableNameData)
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};

    CREATE TABLE {tableName} (
    id serial PRIMARY KEY,
    ensembl_id VARCHAR(256) NOT NULL,
    gene_name VARCHAR(256) NOT NULL,
    expID VARCHAR(256) NOT NULL,
    fileID VARCHAR(256) NOT NULL,
    replicate INT NOT NULL,
    fpkm NUMERIC NOT NULL,
    tpm NUMERIC NOT NULL);
        """.format(tableName=tableNameData))

        printt("importing", fnp)
        with gzip.open(self.fnp) as f:
            self.curs.copy_from(f, tableNameData, '\t',
                                columns=("expID", "replicate", "ensembl_id", "gene_name",
                                         "fileID", "tpm", "fpkm"))
        importedNumRows(self.curs)

    def extractExpIDs(self, tableNameData, tableNameMetadata):
        printt("extracting expIDs...")
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableNameMetadata};

    CREATE TABLE {tableNameMedata} AS
    SELECT DISTINCT expID, fileID, replicate
    FROM {tableNameData}
    """.format(tableNameData = tableNameData,
               tableNameMetadata = tableNameMetadata))
        importedNumRows(self.curs)

    def _doIndexData(self, tableNameData):
        printt("indexing", tableNameData, "...")
        makeIndex(self.curs, tableNameData, ["gene_name"])

    def doIndex(self):
        for isNormalized in [True, False]:
            self._doIndexData(self._tableNameData(isNormalized))

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        with getcursor(DBCONN, "08_setup_log") as curs:
            im = ImportRNAseq(curs, assembly, isNormalized)
            if args.index:
                im.doIndex()
            else:
                im.run()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--index', action="store_true", default=False)
    args = parser.parse_args()
    return args


def main():
    args = parse_args()
    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)
    return 0


if __name__ == '__main__':
    sys.exit(main())

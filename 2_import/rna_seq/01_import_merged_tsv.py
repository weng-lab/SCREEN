#!/usr/bin/env python

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


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
from table_names import GeData, GeExperimentList

class ImportRNAseq(object):
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def _tableNameData(self, isNormalized):
        return GeData(self.assembly, isNormalized)

    def _tableNameExperimentList(self):
        return GeExperimentList(self.assembly)

    def run(self):
        for isNormalized in [True, False]:
            tableNameData = self._tableNameData(isNormalized)
            fnp = paths.geFnp(self.assembly, isNormalized)
            self._setupAndCopy(tableNameData, fnp)
            self._doIndexData(tableNameData)

        # normalizaed and unnormalizaed tables should have same experiments!!
        self._extractExpIDs(tableNameData, self._tableNameExperimentList())

    def _setupAndCopy(self, tableNameData, fnp):
        printt("dropping and creating", tableNameData)
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableNameData};

    CREATE TABLE {tableNameData} (
    id serial PRIMARY KEY,
    ensembl_id VARCHAR(256) NOT NULL,
    gene_name VARCHAR(256) NOT NULL,
    expID VARCHAR(256) NOT NULL,
    fileID VARCHAR(256) NOT NULL,
    replicate INT NOT NULL,
    fpkm NUMERIC NOT NULL,
    tpm NUMERIC NOT NULL);
        """.format(tableNameData=tableNameData))

        printt("importing", fnp)
        with gzip.open(fnp) as f:
            self.curs.copy_from(f, tableNameData, '\t',
                                columns=("expID", "replicate", "ensembl_id", "gene_name",
                                         "fileID", "tpm", "fpkm"))
        importedNumRows(self.curs)

    def _extractExpIDs(self, tableNameData, tableNameExperimentList):
        printt("dropping and creating", tableNameExperimentList)
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableNameExperimentList};

    CREATE TABLE {tableNameExperimentList} AS
    SELECT DISTINCT expID, fileID, replicate
    FROM {tableNameData}
    """.format(tableNameData = tableNameData,
               tableNameExperimentList = tableNameExperimentList))
        importedNumRows(self.curs)

    def _doIndexData(self, tableNameData):
        printt("creating indices in", tableNameData, "...")
        makeIndex(self.curs, tableNameData, ["gene_name", "tpm"])

    def doIndex(self):
        for isNormalized in [True, False]:
            self._doIndexData(self._tableNameData(isNormalized))

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        with getcursor(DBCONN, "08_setup_log") as curs:
            im = ImportRNAseq(curs, assembly)
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

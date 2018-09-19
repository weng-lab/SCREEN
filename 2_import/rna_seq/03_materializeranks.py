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
from table_names import GeData, GeExperimentList, GeMv, GeMetadata

class ImportRNAseq(object):
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def _tableNameData(self, isNormalized):
        return GeData(self.assembly, isNormalized)

    def _tableNameExperimentList(self):
        return GeExperimentList(self.assembly)

    def _tableNameGeneInfo(self):
        return self.assembly + "_gene_info"

    def run(self):
        for isNormalized in [True, False]:
            tableNameData = self._tableNameData(isNormalized)
            ranksMvTable = GeMv(self.assembly, isNormalized, True)
            self._materializeranks(tableNameData,
                GeMetadata(self.assembly),
                self._tableNameGeneInfo(),
                ranksMvTable)
            self._indexmaterializedranks(isNormalized)

    def _materializeranks(self, tableNameData, tableNameMetadata, tableNameGeneInfo, ranksMvTable):
        printt("creating ranks mv", ranksMvTable)
        self.curs.execute("""
DROP MATERIALIZED VIEW IF EXISTS {ranksMvTable} CASCADE;

CREATE MATERIALIZED VIEW {ranksMvTable} AS
SELECT *
FROM (
	SELECT
		joined.*, 
		rank() OVER (
			PARTITION BY expid, gene_type, mitochondrial
			ORDER BY tpm DESC
		)
	FROM (
        SELECT r.ensembl_id, r.gene_name, AVG(r.tpm) as tpm, meta.organ, meta.celltype, meta.agetitle, meta.cellcompartment, meta.biosample_type, meta.expid,
            i.gene_type,
            CASE WHEN r.gene_name LIKE 'MT-%' OR r.gene_name LIKE 'mt-%' THEN True
                ELSE False
            END as mitochondrial
        FROM {tableNameData} r
        JOIN {tableNameMetadata} meta ON meta.expid = r.expid AND meta.replicate = r.replicate
        LEFT JOIN {tableNameGeneInfo} i ON r.ensembl_id = i.ensemblid_ver
        GROUP BY r.ensembl_id, r.gene_name, meta.organ, meta.celltype, meta.agetitle, meta.cellcompartment, meta.biosample_type, i.gene_type, meta.expid, mitochondrial
    ) joined
    WHERE tpm > 0
) ranks
WHERE rank <= 100;
        """.format(tableNameData = tableNameData, tableNameMetadata = tableNameMetadata, tableNameGeneInfo = tableNameGeneInfo,
               ranksMvTable = ranksMvTable))

    def _indexmaterializedranks(self, isNormalized):
        printt("creating indices in", GeMv(self.assembly, isNormalized, True), "...")
        makeIndex(self.curs, GeMv(self.assembly, isNormalized, True), ["ensembl_id", "celltype", "gene_type", "mitochondrial", "expid", "cellcompartment"])
    

    def doIndex(self):
        for isNormalized in [True, False]:
            self._indexmaterializedranks(isNormalized)

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

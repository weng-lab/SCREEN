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
            mvTable = GeMv(self.assembly, isNormalized, False)
            ranksMvTable = GeMv(self.assembly, isNormalized, True)
            self._materializeranks(
                mvTable,
                ranksMvTable)
            self._indexmaterializedranks(isNormalized)

    def _materializeranks(self, mvTable, ranksMvTable):
        printt("creating ranks mv", ranksMvTable)
        self.curs.execute("""
DROP MATERIALIZED VIEW IF EXISTS {ranksMvTable};

CREATE MATERIALIZED VIEW {ranksMvTable} AS
SELECT *
FROM (
	SELECT
		r.*, 
		rank() OVER (
			PARTITION BY celltype, cellcompartment, gene_type, mitochondrial
			ORDER BY maxtpm DESC
		)
	FROM (
		SELECT r.ensembl_id, r.gene_name, MAX(r.tpm) as maxtpm, r.organ, r.celltype, r.agetitle, r.cellcompartment, r.biosample_type, r.gene_type, r.mitochondrial
		FROM {mvTable} r
		GROUP BY r.ensembl_id, r.gene_name, r.organ, r.celltype, r.agetitle, r.cellcompartment, r.biosample_type, r.gene_type, r.mitochondrial
	) r
	WHERE maxtpm > 0
) r
WHERE rank < 150;
        """.format(mvTable = mvTable, ranksMvTable = ranksMvTable))

    def _indexmaterializedranks(self, isNormalized):
        printt("creating indices in", GeMv(self.assembly, isNormalized, True), "...")
        makeIndex(self.curs, GeMv(self.assembly, isNormalized, True), ["ensembl_id", "maxtpm", "celltype", "gene_type", "mitochondrial"])
    

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

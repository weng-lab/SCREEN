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
        #for isNormalized in [True, False]:
        for isNormalized in [False]:
            tableNameData = self._tableNameData(isNormalized)
            mvTable = GeMv(self.assembly, isNormalized, False)
            ranksMvTable = GeMv(self.assembly, isNormalized, True)
            self._materialize(tableNameData,
                GeMetadata(self.assembly),
                self._tableNameGeneInfo(),
                mvTable,
                ranksMvTable)
            self._indexmaterialized(isNormalized)

    def _materialize(self, tableNameData, tableNameMetadata, tableNameGeneInfo, mvTable, ranksMvTable):
        printt("creating mv", mvTable)
        self.curs.execute("""
DROP MATERIALIZED VIEW IF EXISTS {mvTable} CASCADE;

CREATE MATERIALIZED VIEW {mvTable} AS
SELECT
    norm.ensembl_id, norm.gene_name, norm.expid,
	meta.organ, meta.celltype, meta.agetitle, meta.cellcompartment, meta.biosample_type,
    i.gene_type,
	CASE WHEN norm.gene_name LIKE 'MT-%' THEN True
		ELSE False
	END as mitochondrial,
	round(avg(norm.tpm), 2) as tpm_avg,
	round(avg(norm.fpkm), 2) as fpkm_avg,
	array_agg(jsonb_build_object('replicate', norm.replicate, 'tpm', norm.tpm, 'fpkm', norm.fpkm)) as reps,
	count(norm.replicate) as repcount

FROM {tableNameData} norm
INNER JOIN {tableNameMetadata} meta ON norm.expid = meta.expid AND norm.replicate = meta.replicate
LEFT JOIN {tableNameGeneInfo} i ON norm.ensembl_id = i.ensemblid_ver
WHERE (norm.ensembl_id, meta.celltype) IN (
	SELECT ensembl_id, celltype
	FROM {ranksMvTable} top
)
GROUP BY
	norm.expid, norm.ensembl_id, norm.gene_name,
	meta.celltype, meta.organ, meta.agetitle, meta.cellcompartment, meta.biosample_type,
	i.gene_type,
	mitochondrial
        """.format(tableNameData = tableNameData, tableNameMetadata = tableNameMetadata, tableNameGeneInfo = tableNameGeneInfo,
               mvTable = mvTable, ranksMvTable = ranksMvTable))

    def _indexmaterialized(self, isNormalized):
        printt("creating indices in", GeMv(self.assembly, isNormalized, False), "...")
        makeIndex(self.curs, GeMv(self.assembly, isNormalized, False), ["ensembl_id", "tpm_avg", "celltype", "gene_type", "mitochondrial", "expid", "cellcompartment"])
    
    def doIndex(self):
        for isNormalized in [True, False]:
            self._indexmaterialized(isNormalized)

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

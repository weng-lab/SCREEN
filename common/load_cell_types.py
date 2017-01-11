#!/usr/bin/env python

from __future__ import print_function

from elasticsearch import Elasticsearch
import os, sys, json, psycopg2, argparse, fileinput
import cStringIO

from dbconnect import db_connect
from elastic_search_wrapper import ElasticSearchWrapper
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from db_utils import getcursor

class LoadCellTypes:
    def __init__(self, assembly, curs):
        self.assembly = assembly
        self.curs = curs
        self.tableName = paths.IndexCellTypesAndTissues(assembly)

        ctFn = "cellTypeToTissue." + assembly + ".json"
        if "hg19" == assembly:
            ctFn += ".old"
        ctFnp = os.path.join(os.path.dirname(__file__), "../", ctFn)
        with open(ctFnp) as f:
            self.ctToTissue = json.load(f)

    @staticmethod
    def Load(DBCONN, assembly):
        with getcursor(DBCONN, "10_cellTypes") as curs:
            loadCts = LoadCellTypes(assembly, curs)
            return loadCts.load()

    def load(self):
        self.curs.execute('''
        SELECT cellType, tissue
        from {tableName}
        ORDER BY LOWER(cellType), LOWER(tissue)
        '''.format(tableName = self.tableName))
        rets = self.curs.fetchall()

        return [{"value": r[0], "tissue": r[1]} for r in rets]

    @staticmethod
    def Import(local, assembly):
        DBCONN = db_connect(os.path.realpath(__file__), local)
        with getcursor(DBCONN, "10_cellTypes") as curs:
            loadCts = LoadCellTypes(assembly, curs)
            loadCts._setupDb()
            loadCts._import()

    def _setupDb(self):
        print("\tdropping and creating", self.tableName)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tableName};
        CREATE TABLE {tableName}
        (id serial PRIMARY KEY,
        cellType text,
        tissue text
        ) """.format(tableName = self.tableName))

    def _get_tissue(self, celltype):
        if celltype in self.ctToTissue:
            return self.ctToTissue[celltype]
        return ""

    def _import(self):
        es = ElasticSearchWrapper(Elasticsearch())

        r = es.get_field_mapping(index = paths.reJsonIndex(self.assembly),
                                 doc_type = "element",
                                 field = "ranks.dnase")

        ctsRaw = sorted(r["datapairs"], key=lambda s: s[0].lower())
        cts = []
        for datapair in ctsRaw:
            cts.append([datapair[0],
                        self._get_tissue(datapair[0])])

        count = 0
        for ctTissue in cts:
            self.curs.execute("""
            INSERT INTO {tableName}
            (cellType, tissue)
            VALUES (
            %(cellType)s,
            %(tissue)s
)""".format(tableName = self.tableName),
                              {"cellType" : ctTissue[0],
                               "tissue" : ctTissue[1]
                              })
            count += self.curs.rowcount

        print("\tinserted", count, "rows")


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    LoadCellTypes.Import(args)

    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    with getcursor(DBCONN, "08_setup_log") as curs:
        print(LoadCellTypes.Load(DBCONN))

if __name__ == '__main__':
    main()

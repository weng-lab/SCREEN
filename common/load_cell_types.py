from __future__ import print_function

from elasticsearch import Elasticsearch
import os, sys, json, psycopg2, argparse, fileinput
import cStringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect
from elastic_search_wrapper import ElasticSearchWrapper
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from db_utils import getcursor

class LoadCellTypes:
    def __init__(self, curs):
        self.curs = curs
        self.tableName = paths.cellTypeTissueTable

        ctFnp = os.path.join(os.path.dirname(__file__), "../celltypes.txt")
        with open(ctFnp) as f:
            self.ctToTissue = json.load(f)

    @staticmethod
    def Import(args):
        DBCONN = db_connect(os.path.realpath(__file__), args.local)
        with getcursor(DBCONN, "10_cellTypes") as curs:
            loadCts = LoadCellTypes(curs)
            loadCts.setupDb()
            loadCts.load()

    def setupDb(self):
        print('\tdropping and creating", self.tableName)
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
    
    def load(self):
        es = ElasticSearchWrapper(Elasticsearch())

        j = {"name": "cell_line",
             "index": paths.re_json_index,
             "doc_type": "element",
             "field": "ranks.dnase" }

        r = es.get_field_mapping(index=j["index"],
                                 doc_type=j["doc_type"],
                                 field=j["field"])

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

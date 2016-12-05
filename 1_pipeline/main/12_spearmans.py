#!/usr/bin/env python

import os
import sys
import argparse

from joblib import Parallel, delayed

from elasticsearch import Elasticsearch
sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from elastic_search_wrapper import ElasticSearchWrapper

sys.path.append(os.path.join(os.path.dirname(__file__), "../../website/common"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../website"))

from models.correlation import Correlation
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper
from constants import paths, chroms, chrom_lengths

sys.path.append("../../../metadata/utils")
from db_utils import getcursor

marks = {"DNase": ("dnase", None),
         "H3K4me3": ("promoter", "H3K4me3-Only"),
         "H3K4me3_DNase": ("promoter", "DNase+H3K4me3"),
         "H3K27ac": ("enhancer", "H3K27ac-Only"),
         "H3K27ac_DNase": ("enhancer", "DNase+H3K27ac"),
         "CTCF": ("ctcf", "CTCF-Only"),
         "CTCF_DNase": ("ctcf", "DNase+CTCF") }

def _find_in_list(_list, i):
    try:
        return _list.index(i)
    except:
        return -1

class DB:
    def __init__(self, DBCONN, assembly):
        self.DBCONN = DBCONN
        self.assembly = assembly

    def recreate_tables(self):
        tables = ["%s_%s" % (self.assembly, k) for k, v in marks.iteritems()]
        with getcursor(self.DBCONN, "DB::recreate_tables") as curs:
            for table in tables:
                curs.execute("DROP TABLE IF EXISTS {table}".format(table = table))
                curs.execute("""CREATE TABLE {table}
                                ( id serial PRIMARY KEY,
                                  ct1 integer, ct2 integer,
                                  chr text, resolution integer,
                                  correlation decimal[] )""".format(table = table))
            curs.execute("DROP TABLE IF EXISTS %s_totals" % self.assembly)
            curs.execute("""CREATE TABLE %s_totals
                            ( id serial PRIMARY KEY,
                              resolution integer,
                              chr text,
                              bintotals integer[] )""" % self.assembly)
            
    def get_celltypes(self):
        with getcursor(self.DBCONN, "DB::get_celltypes") as curs:
            curs.execute("""SELECT id, celltype FROM celltypesandtissues""")
            r = curs.fetchall()
        return {row[1].replace("\\", "_"): row[0] for row in r}

    def insert_totals(self, _chr, res, totals):
        with getcursor(self.DBCONN, "DB::insert_totals") as curs:
            curs.execute("""INSERT INTO {table} (resolution, chr, bintotals)
                                         VALUES (%(res)s, %(chr)s, %(totals)s)""".format(table = "%s_totals" % self.assembly),
                         {"res": res, "chr": _chr, "totals": totals})

    def insert_correlations(self, field, correlations):
        table = "%s_%s" % (self.assembly, field)
        with getcursor(self.DBCONN, "DB::insert_correlations") as curs:
            for correlation in correlations:
                curs.execute("""INSERT INTO {table} (ct1, ct2, chr, resolution, correlation)
                                             VALUES (%(ct1)s, %(ct2)s, %(chr)s, %(resolution)s, %(correlation)s)""".format(table = table),
                             correlation)
            
class Correlator:
    def __init__(self, es, ds, assembly):
        self.es = es
        self.ds = ds
        self._query = {"query": {"bool": {"must": [{"match": {"position.chrom": ""}},
                                                   {"range": {"position.start": {"lte": 0},
                                                              "position.end": {"gte": 0}}} ]}},
                       "size": 10000 }
        self.assembly = assembly
        self.cts = ds.get_celltypes()
        self.cell_types = [None for i in range(0, len(self.cts))]
        for k, v in self.cts.iteritems():
            self.cell_types[v - 1] = k
        
    def do_correlation(self, _chr, res, fields = {"DNase": ("dnase", None)}):
        start = 0
        _ret = {k: [] for k, v in fields.iteritems()}
        totals = []
        r = {}
        self._query["query"]["bool"]["must"][0]["match"]["position.chrom"] = _chr

        # perform query for each bin on the chromosome
        while start < chrom_lengths[self.assembly][_chr]:
            self._query["query"]["bool"]["must"][1]["range"]["position.start"]["lte"] = start + res - 1
            self._query["query"]["bool"]["must"][1]["range"]["position.end"]["gte"] = start
            results = self.es.search(body = self._query, index = paths.re_json_index)["hits"]["hits"]
            start += res
            totals.append(len(results))
            for k, field in fields.iteritems():
                _ret[k].append(Correlation(results).spearmanr(field[0], field[1]))

        for field, _ in fields.iteritems():
                
            # reorder according to cell type pair
            ret = [[[] for j in range(0, len(self.cell_types))] for i in range(0, len(self.cell_types))]
            for labels, _corr in _ret[field]:
                corr, pval = _corr
                for i in range(0, len(self.cell_types)):
                    _ii = _find_in_list(labels, self.cell_types[i])
                    for j in range(i + 1, len(self.cell_types)):
                        _ij = _find_in_list(labels, self.cell_types[j])
                        ret[i][j].append(corr[_ii][_ij] if _ii != -1 and _ij != -1 else 0.0)

            # format for database insertion
            r[field] = []
            for i in range(0, len(self.cell_types)):
                if self.cell_types[i] not in self.cts: continue
                for j in range(i + 1, len(self.cell_types)):
                    if self.cell_types[j] not in self.cts: continue
                    r[field].append({"ct1": self.cts[self.cell_types[i]],
                                     "ct2": self.cts[self.cell_types[j]],
                                     "chr": _chr, "resolution": res,
                                     "correlation": ret[i][j] })
        
        return (totals, r)
            
def parseargs():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="hg19")
    parser.add_argument('-j', type=int, default=8)
    return parser.parse_args()

# for parallelizing
def run(_chr, res, local, assembly):
    DBCONN = db_connect(os.path.realpath(__file__), local)
    db = DB(DBCONN, assembly)
    es = ElasticSearchWrapper(Elasticsearch())
    correlator = Correlator(es, db, assembly)
    try:
        totals, corrs = correlator.do_correlation(_chr, res, marks)
        for k, v in marks.iteritems():
            print("inserting %s/%d (%s)" % (_chr, res, k))
            db.insert_correlations(k, corrs[k])
    except:
        print("failed to insert %s/%d" % (_chr, res))
    db.insert_totals(_chr, res, totals)

def main():
    args = parseargs()

    # connect to DB, recreate tables
    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    DB(DBCONN, args.assembly).recreate_tables()
    
    # do correlation for each combo and insert
    for res in [300000]:
        Parallel(n_jobs = args.j)(delayed(run)(_chr, res, args.local, args.assembly) for _chr in chroms[args.assembly])
            
    return 0

if __name__ == "__main__":
    sys.exit(main())

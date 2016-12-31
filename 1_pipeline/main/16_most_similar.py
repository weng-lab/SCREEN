import sys, os
import argparse
import json

from elasticsearch import Elasticsearch
import psycopg2, psycopg2.pool

sys.path.append(os.path.join(os.path.dirname(__file__), "../../website/common"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../website"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths
from cached_objects import CachedObjectsWrapper
from elastic_search_wrapper import ElasticSearchWrapper
from postgres_wrapper import PostgresWrapper
from dbconnect import db_connect

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="hg19")
    parser.add_argument('--version', type=int, default=7)    
    return parser.parse_args()

def main():
    args = parse_args()
    es = ElasticSearchWrapper(Elasticsearch())
    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    ps = PostgresWrapper(DBCONN)
    cache = CachedObjectsWrapper(es, ps)[args.assembly]
    cts = [x["value"] for x in cache.cellTypesAndTissues]
    _map = {}
    i = 1
    j = 0

    onp = os.path.expanduser("~/test.lsj")
    for ct in cts:
        _map[ct] = get_20k(ct, es, args.version, args.assembly)
    for ct in cts:
        top20k = get_20k(ct, es, args.version, args.assembly)
        i += 1
        if ct not in _map: continue
        j = 0
        for result in _map[ct]:
            _rmap = {}
            if j % 1000 == 0: print("working with result %d/%d" % (j, len(_map[ct])))
            j += 1
            for sct, v in _map.iteritems():
                if result not in v: continue
                for sresult in v:
                    if sresult == result: continue
                    if sresult not in _rmap: _rmap[sresult] = 0
                    _rmap[sresult] += 1
            _rmap = {k: v for k, v in _rmap.iteritems() if v >= 10}
            with open(onp, "ab") as o:
                o.write(json.dumps({"accession": result, "similar": _rmap}) + "\n")
            del _rmap

if __name__ == '__main__':
    sys.exit(main())

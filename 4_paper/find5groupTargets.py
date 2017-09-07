#!/usr/bin/env python

from __future__ import print_function

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils, AddPath
from exp import Exp
from querydcc import QueryDCC
from cache_memcache import MemCacheWrapper

AddPath(__file__, '../common/')
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper

AddPath(__file__, '../website/common/')
from pg import PGsearch
from cached_objects import CachedObjects
from pg_common import PGcommon
from db_trackhub import DbTrackhub
from cached_objects import CachedObjectsWrapper

def main():
    DBCONN = db_connect(os.path.realpath(__file__))

    ps = PostgresWrapper(DBCONN)
    cacheW = CachedObjectsWrapper(ps)
    db = DbTrackhub(DBCONN)

    tdb = TrackhubDb(None, ps, cacheW, db, UCSC)
    for assembly in [args.assembly]:
        tdb.makeAllTracks(assembly)

    url = "https://www.encodeproject.org/search/?searchTerm=Candidate+Regulatory+Elements+%28cREs%29&type=Annotation"
    url += "&format=json"
    url += "&limit=all"

    mc = MemCacheWrapper("localhost")
    qd = QueryDCC(cache=mc)
    #qd = QueryDCC()

    for exp in qd.getExps(url):
        if not "5-group" in exp.description:
            continue
        alias = exp.jsondata["aliases"][0]
        if "zhiping-weng:cREs-mm10-v10-5group" == alias:
            continue
        print(exp.encodeID, alias)
        


if __name__ == "__main__":
    sys.exit(main())

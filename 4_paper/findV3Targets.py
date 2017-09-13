#!/usr/bin/env python

from __future__ import print_function

import sys
import os
import re

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
from cached_objects import CachedObjectsWrapper

def main():
    DBCONN = db_connect(os.path.realpath(__file__))

    ps = PostgresWrapper(DBCONN)
    cacheW = CachedObjectsWrapper(ps)

    url = "https://www.encodeproject.org/search/?type=Annotation&encyclopedia_version=3&annotation_type=enhancer-like+regions&annotation_type=promoter-like+regions"
    url += "&format=json"
    url += "&limit=all"

    mc = MemCacheWrapper("localhost")
    qd = QueryDCC(cache=mc)
    
    for exp in qd.getExps(url):
        targets = []
        if "H3K27ac" in exp.description:
            targets.append("H3K27ac")
        if "H3K4me3" in exp.description:
            targets.append("H3K4me3")
        if targets:
            print(exp.encodeID, '\t'.join(targets))
            
if __name__ == "__main__":
    sys.exit(main())

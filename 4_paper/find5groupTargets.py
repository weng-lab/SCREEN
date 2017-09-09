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

    url = "https://www.encodeproject.org/search/?searchTerm=Candidate+Regulatory+Elements+%28cREs%29&type=Annotation"
    url += "&format=json"
    url += "&limit=all"

    mc = MemCacheWrapper("localhost")
    qd = QueryDCC(cache=mc)
    #qd = QueryDCC()

    def ctRename(s):
        return re.sub('[^0-9a-zA-Z]+', '-', s)
    
    rctsByAssembly = {}
    rctToCtByAssembly = {}
    for assembly in ["hg19", "mm10"]:
        rctToCtByAssembly[assembly] = {}
        cts = cacheW[assembly].datasets.byCellType.keys()
        for ct in cts:
            rct = ctRename(ct)
            rctToCtByAssembly[assembly][rct] = ct
        rcts = [ctRename(x) for x in cts]
        rctsByAssembly[assembly] = set(rcts)
    
    for exp in qd.getExps(url):
        if not "5-group" in exp.description:
            continue
        alias = exp.jsondata["aliases"][0]
        toks = alias.split('-')
        assembly = toks[2]
        if alias in ["zhiping-weng:cREs-mm10-v10-5group", "zhiping-weng:cREs-hg19-v10-5group"]:
            continue
        cache = cacheW[assembly].datasets.byCellType
        rcts = rctsByAssembly[assembly]
        # zhiping-weng:cREs-mm10-v10-C57BL-6-embryonic-facial-prominence-embryo-11-5-days-5group
        rct = alias.split('v10-')[1]
        #print(alias, ct)
        rct = rct.replace("-5group", '')
        ct = rctToCtByAssembly[assembly][rct]
        if rct not in rcts:
            raise Exception("missing " + rct)
        expInfos = cacheW[assembly].datasets.byCellType[ct]
        
if __name__ == "__main__":
    sys.exit(main())

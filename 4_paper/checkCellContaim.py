#!/usr/bin/env python

from __future__ import print_function

import re
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils, AddPath
from exp import Exp
from biosample import Biosample
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

mc = MemCacheWrapper("localhost")
qd = QueryDCC(cache=mc)

def main():
    with open("/home/mjp/Dropbox/Cross-Contaminations-v8_0.txt") as f:
        lines = [x.strip() for x in f]
    badCts = []
    for line in lines:
        result = re.findall(".*(CVCL_....).*", line, re.MULTILINE)
        for r in result:
            badCts.append(r)
    badCts = set(badCts)

    DBCONN = db_connect(os.path.realpath(__file__))

    ps = PostgresWrapper(DBCONN)
    cacheW = CachedObjectsWrapper(ps)

    for assembly in ["hg19", "mm10"]:
        for ct, exps in cacheW[assembly].datasets.byCellType.iteritems():
            for expInfo in exps:
                fileID = expInfo["fileID"]
                print(fileID)
                exp = qd.getExpFromFileID(fileID)
                try:
                    reps = exp.jsondata["replicates"]
                except:
                    continue
                for rep in reps:
                    biosampleID = rep["library"]["biosample"]["@id"]
                    bs = Biosample(biosampleID)
                    for s in bs.jsondata["dbxrefs"]:
                        result = re.findall(".*(CVCL_....).*", s, re.MULTILINE)
                        for r in result:
                            if r in badCts:
                                raise Exception("found bad " + r)
    sys.exit(1)
    
    url = "https://www.encodeproject.org/search/?searchTerm=Candidate+Regulatory+Elements+%28cREs%29&type=Annotation"
    url += "&format=json"
    url += "&limit=all"

    #qd = QueryDCC()

    for exp in qd.getExps(url):
        if not "5-group" in exp.description:
            continue
        alias = exp.jsondata["aliases"][0]
        toks = alias.split('-')
        assembly = toks[2]
        cache = cacheW[assembly]
        if "zhiping-weng:cREs-mm10-v10-5group" == alias:
            continue
        cts = cache.datasets.byCellType.keys()


        print(exp.encodeID, alias)
        


if __name__ == "__main__":
    sys.exit(main())

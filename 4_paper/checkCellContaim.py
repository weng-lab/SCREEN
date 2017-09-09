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
        byCellType = cacheW[assembly].datasets.byCellType
        counter = 0
        total = len(byCellType.keys())
        for ct, exps in byCellType.iteritems():
            for expInfo in exps:
                counter += 1
                fileID = expInfo["fileID"]
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
                            if r in badCts and r not in ["CVCL_8800", "CVCL_0004", "CVCL_0031",
                                                         "CVCL_0131", "CVCL_0579", "CVCL_0065",
                                                         "CVCL_0480", "CVCL_0546", "CVCL_0002",
                                                         "CVCL_0027", "CVCL_0459", "CVCL_0014",
                                                         "CVCL_0035", "CVCL_7260", "CVCL_0399",
                                                         "CVCL_0023", "CVCL_0320", "CVCL_0317",
                                                         "CVCL_0530", "CVCL_0067"]:
                                print(assembly, counter, total, "found bad " + r)

if __name__ == "__main__":
    sys.exit(main())

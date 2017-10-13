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
    url = "https://www.encodeproject.org/search/?type=Annotation&annotation_type=gene+expression&annotation_type=transcript+expression"
    url += "&format=json"
    url += "&limit=all"

    mc = MemCacheWrapper("localhost")
    qd = QueryDCC(cache=mc)
    #qd = QueryDCC()

    exps = qd.getExps(url)

    for idx, exp in enumerate(exps):
        for f in exp.files:
            if not f.isTSV():
                continue
            f.download()
            with open(f.fnp()) as tsv:
                header = tsv.readline()
            toks = header.split('\t')
            derived = []
            for t in toks:
                if t.startswith("EN"):
                    enc = t.split('_')[0]
                    derived.append(enc)
            # print(idx+1, len(exps),
            print(exp.encodeID + '\t' + ','.join(sorted(list(set(derived)))))


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python

from __future__ import print_function
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils
from exp import Exp
from querydcc import QueryDCC
from cache_memcache import MemCacheWrapper

assaysToCts = {}

d = "/home/purcarom/regElmViz/counts"
for fn in os.listdir(d):
    if not fn.startswith("hg19") or "bigwig" not in fn:
        continue
    fnp = os.path.join(d, fn)
    print(fnp)
    with open(fnp) as f:
        data = [line.rstrip().split('\t') for line in f.readlines()[1:]]
    cellTypes = set([x[2] for x in data])
    expIDs = list(set([x[0] for x in data]))

    cts = set()
    for expID in expIDs:
        exp = Exp.fromJsonFile(expID)
        cts.add(exp.biosample_term_name)

    assay = fn.split('.')[1]
    assaysToCts[assay] = cts

assays = assaysToCts.keys()
for assay, cts in assaysToCts.iteritems():
    print(assay, len(cts))
    for oassay in assays:
        if assay == oassay:
            continue
        print('\t', assay, 'to', oassay,
              'intersection of cell types',
              len(cts.intersection(assaysToCts[oassay])))

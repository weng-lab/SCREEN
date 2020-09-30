#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip
import psycopg2.extras

from coord import Coord

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from cre_utils import isaccession, isclose, checkChrom
from config import Config



class PGcommonWrapper:
    def __init__(self, pg):
        self.assemblies = Config.assemblies
        self.pgs = {a: PGcommon(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]


class PGcommon(object):
    def __init__(self, pw, assembly):
        self.pw = pw
        self.assembly = assembly

    def rankMethodToIDxToCellType(self):
        rows = self.pw.fetchall("pg$getRanIdxToCellType", """
        SELECT idx, celltype, rankmethod
        FROM {tn}
        """.format(tn=self.assembly + "_rankcelltypeindexex"))

        ret = {}
        for r in rows:
            rank_method = r[2]
            if rank_method not in ret:
                ret[rank_method] = {}
            ret[rank_method][r[0]] = r[1]
            ret[rank_method][r[1]] = r[0]
        return ret

    def makeCtMap(self):
        amap = {"DNase": "dnase",
                "H3K4me3": "promoter",  # FIXME: this could be misleading
                "H3K27ac": "enhancer",  # FIXME: this too
                "CTCF": "ctcf",
                "Enhancer": "Enhancer",
                "Promoter": "Promoter",
                "Insulator": "Insulator"
                }
        rmInfo = self.rankMethodToIDxToCellType()
        return {amap[k]: v for k, v in rmInfo.items() if k in amap}

    def makeCTStable(self):
        rows = self.pw.fetchall("pg$makeCTStable", """
        SELECT cellTypeName, pgidx
        FROM {tn}
        """.format(tn=self.assembly + "_cre_groups_cts"))
        
        return {r[0]: r[1] for r in rows}

    def datasets(self, assay):
        rows = self.pw.fetchall("datasets", """
        SELECT cellTypeName, expID, fileID
        FROM {tn}
        where assay = %s
        """.format(tn=self.assembly + "_datasets"),
                                (assay, ))

        if 0 == len(rows):
            raise Exception("no rows found--bad assay? " + assay)
        return {r[0]: (r[1], r[2]) for r in rows}

    def datasets_multi(self, assay):
        rows = self.pw.fetchallAsDict("datasets", """
        SELECT *
        FROM {tn}
        where assays = %s
        """.format(tn=self.assembly + "_datasets_multi"),
                                             (assay, ))
        if 0 == len(rows):
            raise Exception("no rows found--bad assay? " + assay)
        
        ret = {}
        for r in rows:
            ret[r["celltypename"]] = r
        return ret

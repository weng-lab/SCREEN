#!/usr/bin/env python

import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip

from coord import Coord

sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))
from config import Config
from get_set_mc import GetOrSetMemCache

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor

class PGcommonWrapper:
    def __init__(self, pg):
        self.assemblies = Config.assemblies
        self.pgs = {a : PGcommon(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

class PGcommon(GetOrSetMemCache):
    def __init__(self, pg, assembly):
        GetOrSetMemCache.__init__(self, assembly, "PGcommon")
        self.pg = pg
        self.assembly = assembly

    def rankMethodToIDxToCellType(self):
        with getcursor(self.pg.DBCONN, "pg$getRanIdxToCellType") as curs:
            curs.execute("""
SELECT idx, celltype, rankmethod
FROM {tn}
""".format(tn = self.assembly + "_rankcelltypeindexex"))
            ret = {}
            for r in curs.fetchall():
                rank_method = r[2]
                if rank_method not in ret:
                    ret[rank_method] = {}
                ret[rank_method][r[0]] = r[1]
                ret[rank_method][r[1]] = r[0]
        return ret

    def makeCtMap(self):
        amap = {"DNase": "dnase",
                "H3K4me3": "promoter", # FIXME: this could be misleading
                "H3K27ac": "enhancer", # FIXME: this too
                "CTCF": "ctcf"}
        rmInfo = self.rankMethodToIDxToCellType()
        return {amap[k]: v for k, v in rmInfo.iteritems() if k in amap}

    def makeCTStable(self):
        if "hg19" != self.assembly:
            return {}
        tableName = self.assembly + "_cre_groups_cts"
        with getcursor(self.pg.DBCONN, "pg$makeCTStable") as curs:
            curs.execute("""
SELECT cellTypeName, pgidx
FROM {tn}
""".format(tn = tableName))
            rows = curs.fetchall()
        return {r[0] : r[1] for r in rows}


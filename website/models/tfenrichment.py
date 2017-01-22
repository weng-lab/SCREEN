#!/usr/bin/env python

from __future__ import print_function
import os, sys
from joblib import delayed, Parallel

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer
from db_utils import getcursor

class TFEnrichment:
    def __init__(self, ps, assembly, cache):
        self.ps = ps
        self.cache = cache
        self.assembly = assembly

    def _process(self, r, c):
        ret = {}
        i = 1.0 / float(c)
        with Timer("process TFs"):
            for _v in r:
                v = _v[0].split(",")[0][1:]
                if v not in ret: ret[v] = 0.0
                ret[v] += i
        return ret
        
    def findenrichment(self, left, right, threshold = 20000):
        cti = self.cache.rankMethodToIDxToCellType["DNase"]
        left = [cti[x] for x in left if x in cti]
        right = [cti[x] for x in right if x in cti]
        def whereclause(inc, exc):
            inc = " or ".join(["dnase_rank[%d] <= %d" % (x, threshold) for x in inc])
            exc = " and ".join(["dnase_rank[%d] > %d" % (x, threshold) for x in exc])
            return "(%s) and (%s)" % (inc, exc)
        with getcursor(self.ps.DBCONN, "tfenrichment$TFEnrichment::findenrichment") as curs:
            with Timer("tf query"):
                curs.execute("""SELECT jsonb_each_text(tf) FROM {tableName}, {pTableName}
                                WHERE {whereclause} AND {tableName}.accession = {pTableName}.accession""".format(tableName=self.assembly + "_cre",
                                                                                                                 pTableName=self.assembly + "_peakIntersections",
                                                                                                                 whereclause=whereclause(left, right)))
                l = curs.fetchall()
                curs.execute("""SELECT COUNT(*) FROM {tableName}, {pTableName}
                                WHERE {whereclause} AND {tableName}.accession = {pTableName}.accession""".format(tableName=self.assembly + "_cre",
                                                                                                                 pTableName=self.assembly + "_peakIntersections",
                                                                                                                 whereclause=whereclause(left, right)))
                lc = curs.fetchone()[0]
            with Timer("tf query"):
                curs.execute("""SELECT jsonb_each_text(tf) FROM {tableName}, {pTableName}
                                WHERE {whereclause} AND {tableName}.accession = {pTableName}.accession""".format(tableName=self.assembly + "_cre",
                                                                                                                 pTableName=self.assembly + "_peakIntersections",
                                                                                                                 whereclause=whereclause(right, left)))
                r = curs.fetchall()
                curs.execute("""SELECT COUNT(*) FROM {tableName}, {pTableName}
                                WHERE {whereclause} AND {tableName}.accession = {pTableName}.accession""".format(tableName=self.assembly + "_cre",
                                                                                                                 pTableName=self.assembly + "_peakIntersections",
                                                                                                                 whereclause=whereclause(right, left)))
                rc = curs.fetchone()[0]
        ret = {"left": self._process(l, lc),
               "right": self._process(r, rc)}
        tfa = {}
        for k, v in ret["left"].iteritems():
            tfa[k] = {"left": v, "right": ret["right"][k] if k in ret["right"] else 0.0}
        for k, v in ret["right"].iteritems():
           if k not in ret["left"]:
               tfa[k] = {"left": 0.0, "right": v}
        return {"tfs": {"left": sorted([{"key": k, "left": v["left"], "right": v["right"]}
                                        for k, v in tfa.iteritems() if v["left"] - v["right"] > 0],
                                       key=lambda x: x["right"] - x["left"]),
                        "right": sorted([{"key": k, "left": v["left"], "right": v["right"]}
                                         for k, v in tfa.iteritems() if v["left"] - v["right"] < 0],
                                        key=lambda x: x["left"] - x["right"]) }}

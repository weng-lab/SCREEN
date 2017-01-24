#!/usr/bin/env python

from __future__ import print_function
import os, sys
from joblib import delayed, Parallel

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer, escape_html
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

    def findenrichment(self, tree_rank_method, leftRaw, rightRaw, threshold = 20000):
        cti = self.cache.rankMethodToIDxToCellType[tree_rank_method]

        lookup = {"CTCF" : "ctcf_only",
                  "DNase" : "dnase",
                  "Insulator" : "ctcf_dnase",
                  "Enhancer" : "h3k27ac_dnase",
                  "Promoter" : "h3k4me3_dnase",
                  "H3K27ac" : "h3k27ac_only",
                  "H3K4me3" : "h3k4me3_only"}
        
        left = [cti[x] for x in leftRaw if x in cti]
        right = [cti[x] for x in rightRaw if x in cti]
        print(left)
        print(right)
        def whereclause(inc, exc, assay = lookup[tree_rank_method]):
            inc = " or ".join(["%s_zscore[%d] > 1.64" % (assay, x) for x in inc])
            exc = " and ".join(["%s_zscore[%d] <= 1.64" % (assay, x) for x in exc])
            return "(%s) and (%s)" % (inc, exc)
        with getcursor(self.ps.DBCONN, "tfenrichment$TFEnrichment::findenrichment") as curs:
            with Timer("tf query"):
                q = """SELECT jsonb_each_text(tf) FROM {tableName}, {pTableName}
                WHERE {whereclause} AND {tableName}.accession = {pTableName}.accession
                """.format(tableName=self.assembly + "_cre",
                           pTableName=self.assembly + "_peakIntersections",
                           whereclause=whereclause(left, right))
                print(q)
                curs.execute(q)
                l = curs.fetchall()
                curs.execute(
                    """SELECT COUNT(*) FROM {tableName}, {pTableName}
                                WHERE {whereclause} AND {tableName}.accession = {pTableName}.accession
""".format(tableName=self.assembly + "_cre",
           pTableName=self.assembly + "_peakIntersections",
           whereclause=whereclause(left, right)))
                lc = curs.fetchone()[0]
            with Timer("tf query"):
                curs.execute(
                    """SELECT jsonb_each_text(tf) FROM {tableName}, {pTableName}
                                WHERE {whereclause} AND {tableName}.accession = {pTableName}.accession
""".format(tableName=self.assembly + "_cre",
           pTableName=self.assembly + "_peakIntersections",
           whereclause=whereclause(right, left)))
                r = curs.fetchall()
                curs.execute(
                    """SELECT COUNT(*) FROM {tableName}, {pTableName}
                                WHERE {whereclause} AND {tableName}.accession = {pTableName}.accession
""".format(tableName=self.assembly + "_cre",
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
        return {"title" : escape_html(leftRaw[0]) + " vs " + escape_html(rightRaw[0]),
                "tfs": {"left": sorted([{"key": k, "left": v["left"], "right": v["right"]}
                                        for k, v in tfa.iteritems() if v["left"] - v["right"] > 0],
                                       key=lambda x: x["right"] - x["left"]),
                        "right": sorted([{"key": k, "left": v["left"], "right": v["right"]}
                                         for k, v in tfa.iteritems() if v["left"] - v["right"] < 0],
                                        key=lambda x: x["left"] - x["right"]) }}

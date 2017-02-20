#!/usr/bin/env python

from __future__ import print_function

import os

class CRE:
    def __init__(self, pgSearch, accession, cache):
        self.pgSearch = pgSearch
        self.accession = accession
        self.pos = None
        self.genesAll = None
        self.genesPC = None
        self.tad = None
        self.ranks = None
        self.intersectCounts = None
        self.cache = cache

    def coord(self):
        if not self.pos:
            self.pos = self.pgSearch.crePos(self.accession)
        return self.pos

    def intersectingSnps(self, halfWindow):
        return self.pgSearch.intersectingSnps(self.coord(), halfWindow)

    def distToNearbyCREs(self, halfWindow):
        return self.pgSearch.distToNearbyCREs(self.accession, self.coord(),
                                              halfWindow)

    def nearbyGenes(self):
        coord = self.coord()
        if not self.genesAll or not self.genesPC:
            self.genesAll, self.genesPC = self.pgSearch.creGenes(self.accession,
                                                                 coord.chrom)
        ret = []
        for g in list(set(self.genesAll + self.genesPC)):
            ret.append({"name" : g[0], "distance" : g[1]})
        return ret

    def genesInTad(self):
        coord = self.coord()
        if self.tad is None:
            self.tad = self.pgSearch.creTad(self.accession, coord.chrom)
        return self.tad

    def promoterRanks(self):
        coord = self.coord()
        return self.pgSearch.creRanksPromoter(self.accession, coord.chrom)

    def enhancerRanks(self):
        coord = self.coord()
        return self.pgSearch.creRanksPromoter(self.accession, coord.chrom)

    def allRanks(self):
        coord = self.coord()
        if not self.ranks:
            self.ranks = self.pgSearch.creRanks(self.accession, coord.chrom)
        return self.ranks

    def _ctToTissue(self, ct):
        try:
            return self.cache.datasets.globalCellTypeInfo[ct]["tissue"]
        except:
            return ""

    def topTissues(self):
        # ['Enhancer', 'H3K4me3', 'H3K27ac', 'Promoter', 'DNase', 'Insulator', 'CTCF']
        rmToCts = self.cache.rankMethodToCellTypes

        # ['h3k4me3-only', 'dnase+ctcf', 'dnase+h3k27ac', 'dnase+h3k4me3', 'dnase', 'h3k27ac-only', 'ctcf-only']
        ranks = self.allRanks()["zscores"]

        def get_rank(ct, d):
            return -11.0 if ct not in d else d[ct]
        def arrToCtDict(arr, cts):
            if len(arr) != len(cts):
                print("error in top tissues", len(arr), len(cts))
                assert(len(arr) == len(cts))
            ret = {}
            for idx, v in enumerate(arr):
                ret[cts[idx]] = v
            return ret
        def makeArrRanks(rm1, ctrm1):
            ret = []
            oneAssay = arrToCtDict(ranks[rm1], rmToCts[ctrm1])
            for ct, v in oneAssay.iteritems():
                r = {"tissue" : self._ctToTissue(ct), "ct" : ct, "one" : v}
                ret.append(r)
            return ret
        def makeArrMulti(rm1, ctrm1, rm2, ctrm2):
            ret = []
            oneAssay = arrToCtDict(ranks[rm1], rmToCts[ctrm1])
            multiAssay = arrToCtDict(ranks[rm2], rmToCts[ctrm2])
            for ct, v in oneAssay.iteritems():
                r = {"tissue" : self._ctToTissue(ct), "ct" : ct,
                     "one" : v, "two": get_rank(ct, multiAssay)}
                ret.append(r)
            return ret

        return {"dnase": makeArrRanks("dnase", "DNase"),
                "promoter": makeArrMulti("h3k4me3-only", "H3K4me3",
                                         "dnase+h3k4me3", "Promoter"),
                "enhancer": makeArrMulti("h3k27ac-only", "H3K27ac",
                                         "dnase+h3k27ac", "Enhancer"),
                "ctcf": makeArrMulti("ctcf-only", "CTCF",
                                     "dnase+ctcf", "Insulator")}

    def peakIntersectCount(self):
        coord = self.coord()
        if not self.intersectCounts:
            self.intersectCounts = self.pgSearch.peakIntersectCount(self.accession, coord.chrom)
        return self.intersectCounts

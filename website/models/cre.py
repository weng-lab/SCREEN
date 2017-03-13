#!/usr/bin/env python

from __future__ import print_function

import os

class CRE:
    def __init__(self, pgSearch, accession, cache):
        self.pgSearch = pgSearch
        self.accession = accession
        self.cache = cache
        self.assembly = cache.assembly
        self.pos = None
        self.genesAll = None
        self.genesPC = None
        self.tad = None
        self.ranks = None
        self.intersectCounts = None

    def coord(self):
        if not self.pos:
            self.pos = self.pgSearch.crePos(self.accession)
        return self.pos

    def intersectingSnps(self, halfWindow):
        return self.pgSearch.intersectingSnps(self.accession, self.coord(),
                                              halfWindow)

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
            ret.append({"name" : g[0], "distance" : g[1], "ensemblid_ver" : g[2]})
        return ret

    def nearbyPcGenes(self):
        coord = self.coord()
        if not self.genesAll or not self.genesPC:
            self.genesAll, self.genesPC = self.pgSearch.creGenes(self.accession,
                                                                 coord.chrom)
        ret = []
        for g in list(set(self.genesPC)):
            ret.append({"name" : g[0], "distance" : g[1], "ensemblid_ver" : g[2]})
        return ret

    def genesInTad(self):
        if "mm10" == self.assembly:
            return []
        coord = self.coord()
        rows = self.pgSearch.genesInTad(self.accession, coord.chrom)
        lookup = self.cache.geneIDsToApprovedSymbol
        ret = []
        for r in rows:
            for g in r[0]:
                ret.append({"name" : lookup[g]})
        return ret

    def cresInTad(self):
        if "mm10" == self.assembly:
            return []
        coord = self.coord()
        return self.pgSearch.cresInTad(self.accession, coord.chrom, coord.start)

    def promoterRanks(self):
        coord = self.coord()
        return self.pgSearch.creRanksPromoter(self.accession, coord.chrom)

    def enhancerRanks(self):
        coord = self.coord()
        return self.pgSearch.creRanksPromoter(self.accession, coord.chrom)

    def allRanks(self):
        if not self.ranks:
            coord = self.coord()
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

        # ['enhancer', 'h3k4me3', 'h3k27ac', 'promoter', 'dnase', 'insulator', 'ctcf']
        ranks = self.allRanks()

        def get_rank(ct, d):
            return -11.0 if ct not in d else d[ct]
        def arrToCtDict(arr, cts):
            if len(arr) != len(cts):
                print("\n****************************")
                print("error in top tissues", len(arr), len(cts))
                print("\n", "arr", arr)
                print("\n", "cts", cts)
                print("****************************\n")
                assert(len(arr) == len(cts))
            ret = {}
            for idx, v in enumerate(arr):
                ret[cts[idx]] = v
            return ret
        def makeArrRanks(rm1):
            ret = []
            oneAssay = arrToCtDict(ranks[rm1.lower()], rmToCts[rm1])
            for ct, v in oneAssay.iteritems():
                r = {"tissue" : self._ctToTissue(ct), "ct" : ct, "one" : v}
                ret.append(r)
            return ret
        def makeArrMulti(rm1, rm2):
            ret = []
            oneAssay = arrToCtDict(ranks[rm1.lower()], rmToCts[rm1])
            multiAssay = arrToCtDict(ranks[rm2.lower()], rmToCts[rm2])
            for ct, v in oneAssay.iteritems():
                r = {"tissue" : self._ctToTissue(ct), "ct" : ct,
                     "one" : v, "two": get_rank(ct, multiAssay)}
                ret.append(r)
            return ret

        return {"dnase": makeArrRanks("DNase"),
                "promoter": makeArrMulti("H3K4me3", "Promoter"),
                "enhancer": makeArrMulti("H3K27ac", "Enhancer"),
                "ctcf": makeArrMulti("CTCF", "Insulator")}

    def peakIntersectCount(self):
        coord = self.coord()
        if not self.intersectCounts:
            self.intersectCounts = self.pgSearch.peakIntersectCount(self.accession, coord.chrom, self.cache.tfHistCounts)
        return self.intersectCounts

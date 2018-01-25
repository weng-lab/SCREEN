#!/usr/bin/env python2

from __future__ import print_function

import os


class CRE:
    def __init__(self, pgSearch, accession, cache):
        self.pgSearch = pgSearch
        self.accession = accession
        self.cache = cache
        self.pos = None
        self.ranks = None
        self.intersectCounts = None

    def coord(self):
        if not self.pos:
            self.pos = self.pgSearch.crePos(self.accession)
        return self.pos

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
                r = {"tissue": self._ctToTissue(ct), "ct": ct, "one": v}
                ret.append(r)
            return ret

        def makeArrMulti(rm1, rm2):
            ret = []
            oneAssay = arrToCtDict(ranks[rm1.lower()], rmToCts[rm1])
            multiAssay = arrToCtDict(ranks[rm2.lower()], rmToCts[rm2])
            for ct, v in oneAssay.iteritems():
                r = {"tissue": self._ctToTissue(ct), "ct": ct,
                     "one": v, "two": get_rank(ct, multiAssay)}
                ret.append(r)
            return ret

        return {"dnase": makeArrRanks("DNase"),
                "promoter": makeArrMulti("H3K4me3", "Promoter"),
                "enhancer": makeArrMulti("H3K27ac", "Enhancer"),
                "ctcf": makeArrMulti("CTCF", "Insulator")}

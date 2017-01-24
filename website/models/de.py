#!/usr/bin/env python

from __future__ import print_function

from cre import CRE

class DE:
    def __init__(self, cache, pgSearch, gene, ct1, ct2):
        self.cache = cache
        self.pgSearch = pgSearch
        self.gene = gene
        self.ct1 = ct1
        self.ct2 = ct2
        self.pos = None

    def coord(self):
        if not self.pos:
            self.pos = self.pgSearch.genePos(self.gene)
        return self.pos

    def diffCREs(self):
        halfWindow = 500000

        rankMethodToIDxToCellType = self.cache.rankMethodToIDxToCellType
        #print(rankMethodToIDxToCellType["Enhancer"].keys())
        ct1EnhancerIdx = rankMethodToIDxToCellType["Enhancer"][self.ct1]
        ct2EnhancerIdx = rankMethodToIDxToCellType["Enhancer"][self.ct2]
        ct1PromoterIdx = rankMethodToIDxToCellType["Promoter"][self.ct1]
        ct2PromoterIdx = rankMethodToIDxToCellType["Promoter"][self.ct2]

        cols = ["accession", "start", "stop",
                "h3k4me3_dnase_zscore[%s]" % ct1PromoterIdx,
                "h3k4me3_dnase_zscore[%s]" % ct2PromoterIdx,
                "h3k27ac_dnase_zscore[%s]" % ct1EnhancerIdx,
                "h3k27ac_dnase_zscore[%s]" % ct2EnhancerIdx]
        nearbyCREs = self.pgSearch.nearbyCREs(self.coord(), halfWindow, cols)
        print("found", len(nearbyCREs))

        diffCREs = []
        for c in nearbyCREs:
            diffCREs.append([c[1], c[4] - c[3], "promoter"])
            diffCREs.append([c[1], c[6] - c[5], "enhancer"])

        nearbyDEs = self.pgSearch.nearbyDEs(self.coord(), halfWindow,
                                            self.ct1, self.ct2)

        return {"diffCREs" : { "data" : diffCREs } }

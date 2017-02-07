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
        self.halfWindow = 400000

    def coord(self):
        if not self.pos:
            self.pos = self.pgSearch.genePos(self.gene)
        return self.pos

    def diffCREs(self):
        rankMethodToIDxToCellType = self.cache.rankMethodToIDxToCellType
        #print(rankMethodToIDxToCellType["Enhancer"].keys())
        ct1EnhancerIdx = rankMethodToIDxToCellType["H3K27ac"][self.ct1]
        ct2EnhancerIdx = rankMethodToIDxToCellType["H3K27ac"][self.ct2]
        ct1PromoterIdx = rankMethodToIDxToCellType["H3K4me3"][self.ct1]
        ct2PromoterIdx = rankMethodToIDxToCellType["H3K4me3"][self.ct2]
        
        ret = []
        thres = 1.64

        cols = ["accession", "start", "stop",
                "h3k4me3_only_zscore[%s]" % ct1PromoterIdx,
                "h3k4me3_only_zscore[%s]" % ct2PromoterIdx]
        cresPromoter = self.pgSearch.nearbyCREs(self.coord(), 2*self.halfWindow, cols, True)
        print("found promoter-like CREs:", len(cresPromoter))
        for c in cresPromoter:
            if c[3] > thres or c[4] > thres:
                ret.append([c[1], round(float(c[4] - c[3]), 3), "promoter-like"])

        cols = ["accession", "start", "stop",
                "h3k27ac_only_zscore[%s]" % ct1EnhancerIdx,
                "h3k27ac_only_zscore[%s]" % ct2EnhancerIdx]
        cresEnhancer = self.pgSearch.nearbyCREs(self.coord(), 2*self.halfWindow, cols, False)
        print("found enhancer-like CREs", len(cresEnhancer))
        for c in cresEnhancer:
            if c[3] > thres or c[4] > thres:
                ret.append([c[1], round(float(c[4] - c[3]), 3), "enhancer-like"])
        return {"data" : ret}
    
    def nearbyDEs(self):
        # limb_14.5 from C57BL-6_limb_embryo_14.5_days
        ct1 = self.ct1.replace("C57BL-6_", "").replace("embryo_", "").replace("_days", "")
        ct2 = self.ct2.replace("C57BL-6_", "").replace("embryo_", "").replace("_days", "")

        nearbyDEs = self.pgSearch.nearbyDEs(self.coord(), self.halfWindow,
                                            ct1, ct2, 1) #0.05)

        print(self.coord())

        #print(len(nearbyDEs))
        if not nearbyDEs:
            return { "data" : None,
                     "xdomain" : 2 * self.halfWindow }
        
        xdomain = [max(0, min([d[0] for d in nearbyDEs]) - self.halfWindow),
                   max([d[1] for d in nearbyDEs]) + self.halfWindow]

        ret = []
        for d in nearbyDEs:
            e = [float(d[1] - d[0]) / 2 + d[0], # center
                 round(float(d[2]), 3), # log2FoldChange
                 d[0], # start
                 d[1], # stop
                 d[3], d[4], self.cache._try_genename(d[5]) # names
                 ]
            print(d, e, d[1] - d[0])
            ret.append(e)

        return {"data" : ret,
                "xdomain" : xdomain,
                "ymin" : min([d[1] for d in ret]),
                "ymax" : max([d[1] for d in ret])}

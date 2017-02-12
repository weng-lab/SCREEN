#!/usr/bin/env python

from __future__ import print_function

from cre import CRE
from common.pg import PGsearch
from common.pg_de import PGde

class DE:
    def __init__(self, cache, ps, assembly, gene, ct1, ct2):
        self.cache = cache
        self.ps = ps
        self.assembly = assembly
        self.gene = gene
        self.ct1 = ct1
        self.ct2 = ct2

        self.pgSearch = PGsearch(ps, assembly)
        self.pos = None

        self.halfWindow = 250 * 1000 * 2
        self.thres = 1.64
        self.radiusScale = 10

    def coord(self):
        if not self.pos:
            self.pos, self.names = self.pgSearch.genePos(self.gene)
        if not self.pos:
            raise Exception("invalid pos for " + self.gene)
        return self.pos

    def _nearbyPromoters(self):
        rankMethodToIDxToCellType = self.cache.rankMethodToIDxToCellType
        #print(rankMethodToIDxToCellType["Enhancer"].keys())
        ct1PromoterIdx = rankMethodToIDxToCellType["H3K4me3"][self.ct1]
        ct2PromoterIdx = rankMethodToIDxToCellType["H3K4me3"][self.ct2]

        cols = ["accession", "start", "stop",
                "h3k4me3_only_zscore[%s]" % ct1PromoterIdx,
                "h3k4me3_only_zscore[%s]" % ct2PromoterIdx]
        cresPromoter = self.pgSearch.nearbyCREs(self.coord(),
                                                2 * self.halfWindow,
                                                cols, True)
        #print("found promoter-like CREs:", len(cresPromoter))

        ret = []
        for c in cresPromoter:
            if c[3] > self.thres or c[4] > self.thres:
                radius = float(c[2] - c[1]) / 2
                ret.append([radius + c[1], # center
                            round(float(c[4] - c[3]), 3),
                            "promoter-like",
                            self.radiusScale * radius
                ])
        return ret

    def _nearbyEnhancers(self):
        rankMethodToIDxToCellType = self.cache.rankMethodToIDxToCellType
        #print(rankMethodToIDxToCellType["Enhancer"].keys())
        ct1EnhancerIdx = rankMethodToIDxToCellType["H3K27ac"][self.ct1]
        ct2EnhancerIdx = rankMethodToIDxToCellType["H3K27ac"][self.ct2]

        cols = ["accession", "start", "stop",
                "h3k27ac_only_zscore[%s]" % ct1EnhancerIdx,
                "h3k27ac_only_zscore[%s]" % ct2EnhancerIdx]
        cresEnhancer = self.pgSearch.nearbyCREs(self.coord(),
                                                self.halfWindow,
                                                cols, False)
        #print("found enhancer-like CREs", len(cresEnhancer))

        ret = []
        for c in cresEnhancer:
            if c[3] > self.thres or c[4] > self.thres:
                radius = float(c[2] - c[1]) / 2
                ret.append([radius + c[1], # center
                            round(float(c[4] - c[3]), 3),
                            "enhancer-like",
                            self.radiusScale * radius
                ])
        return ret

    def diffCREs(self):
        ret = self._nearbyPromoters() + self._nearbyEnhancers()
        return {"data" : ret}

    def _DEsForDisplay(self, nearbyDEs):
        ret = []
        for d in nearbyDEs:
            genename, strand = self.cache.lookupEnsembleGene(d[5])
            #print("here", d[5], genename, strand)
            e = [float(d[1] - d[0]) / 2 + d[0], # center
                 round(float(d[2]), 3), # log2FoldChange
                 d[0], # start
                 d[1], # stop
                 d[3], # leftName
                 d[4], # rightName
                 genename, strand
                 ]
            #print("de", d, e, d[1] - d[0])
            ret.append(e)

        ret.sort(key = lambda d: d[2]) # sort by start
        return ret

    def nearbyDEs(self):
        # limb_14.5 from C57BL-6_limb_embryo_14.5_days
        ct1 = self.ct1.replace("C57BL-6_", "").replace("embryo_", "").replace("_days", "")
        ct2 = self.ct2.replace("C57BL-6_", "").replace("embryo_", "").replace("_days", "")

        cd = self.coord()

        pg = PGde(self.pgSearch.pg, self.assembly)
        nearbyDEs = pg.nearbyDEs(cd, self.halfWindow, ct1, ct2, 0.05)

        if not nearbyDEs:
            return { "data" : None,
                     "xdomain" : 2 * self.halfWindow }

        xdomain = [max(0, min([d[0] for d in nearbyDEs])),
                   max([d[1] for d in nearbyDEs])]
        center = float(xdomain[1] - xdomain[0]) / 2 + xdomain[0]
        xdomain = [max(0, center - self.halfWindow),
                   center + self.halfWindow]

        ret = self._DEsForDisplay(nearbyDEs)

        return {"names" : self.names,
                "data" : ret,
                "xdomain" : xdomain,
                "ymin" : min([d[1] for d in ret]),
                "ymax" : max([d[1] for d in ret])}

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
                ret.append({"center" : radius + c[1],
                            "value" : round(float(c[4] - c[3]), 3),
                            "typ" : "promoter-like",
                            "width" : self.radiusScale * radius,
                            "accession": c[0],
                            "start": c[1],
                            "len" : c[2] - c[1]})
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
                ret.append({"center": radius + c[1], # center
                            "value": round(float(c[4] - c[3]), 3),
                            "typ" : "enhancer-like",
                            "width" : self.radiusScale * radius,
                            "accession": c[0],
                            "start": c[1],
                            "len" : c[2] - c[1]})
        return ret

    def diffCREs(self):
        ret = self._nearbyPromoters() + self._nearbyEnhancers()
        return {"data" : ret}

    def _genesInRegion(self, start, stop):
        pos = self.coord()
        return self.pgSearch.genesInRegion(pos.chrom, int(start), int(stop))

    def _DEsForDisplay(self, nearbyDEs):
        ret = []
        for d in nearbyDEs:
            genename, strand = self.cache.lookupEnsembleGene(d[5])
            ret.append({"fc" : round(float(d[2]), 3),
                        "start" : d[0],
                        "stop" : d[1],
                        "gene" : genename,
                        "strand" : strand})
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

        # center on middle of DEs
        cxdomain = [max(0, min([d[0] for d in nearbyDEs])),
                   max([d[1] for d in nearbyDEs])]
        center = float(cxdomain[1] - cxdomain[0]) / 2 + cxdomain[0]

        # widen each side
        xdomain = [max(0, center - self.halfWindow),
                   center + self.halfWindow]

        genes = self._genesInRegion(min(xdomain[0], cxdomain[0]),
                                    max(xdomain[1], cxdomain[1]))

        ret = self._DEsForDisplay(nearbyDEs)


        return {"names" : self.names,
                "data" : ret,
                "xdomain" : xdomain,
                "genes" : genes,
                "ymin" : min([d["fc"] for d in ret]),
                "ymax" : max([d["fc"] for d in ret])}

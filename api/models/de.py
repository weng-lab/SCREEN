#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from .cre import CRE
from common.pg_search import PGsearch
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

    def _parseCE(self, typ, c):
        radius = float(c[2] - c[1]) / 2
        return {"center": radius + c[1],
                "value": round(float(c[4] - c[3]), 3),
                "typ": typ,
                "width": 4,
                "accession": c[0],
                "start": c[1],
                "stop": c[2],
                "len": c[2] - c[1]}

    def _nearbyPromoters(self):
        rmLookup = self.cache.rankMethodToIDxToCellType["H3K4me3"]
        if self.ct1 not in rmLookup or self.ct2 not in rmLookup:
            return []
        ct1PromoterIdx = rmLookup[self.ct1]
        ct2PromoterIdx = rmLookup[self.ct2]

        cols = [self.assembly + "_cre_all.accession AS accession", "start", "stop",
                "h3k4me3_zscores[%s]" % ct1PromoterIdx,
                "h3k4me3_zscores[%s]" % ct2PromoterIdx]
        cres = self.pgSearch.nearbyCREs(self.coord(), 2 * self.halfWindow,
                                        cols, True)
        
        ret = []
        for c in [ x for x in cres if "PLS" in self.cache.groups[x[0]] ]:
            if c[3] > self.thres or c[4] > self.thres:
                ret.append(self._parseCE("promoter-like signature", c))
        return ret

    def _nearbyEnhancers(self):
        rmLookup = self.cache.rankMethodToIDxToCellType["H3K27ac"]
        if self.ct1 not in rmLookup or self.ct2 not in rmLookup:
            return []
        ct1EnhancerIdx = rmLookup[self.ct1]
        ct2EnhancerIdx = rmLookup[self.ct2]

        cols = [self.assembly + "_cre_all.accession AS accession", "start", "stop",
                "h3k27ac_zscores[%s]" % ct1EnhancerIdx,
                "h3k27ac_zscores[%s]" % ct2EnhancerIdx]
        cres = self.pgSearch.nearbyCREs(self.coord(), 2 * self.halfWindow,
                                        cols, False)
        cres += self.pgSearch.nearbyCREs(self.coord(), 2 * self.halfWindow,
                                         cols, True)
        ret = []
        for c in [ x for x in cres if "ELS" in self.cache.groups[x[0]] ]:
            if c[3] > self.thres or c[4] > self.thres:
                ret.append(self._parseCE("enhancer-like signature", c))
        return ret

    def diffCREs(self, xdomain):
        xstart = xdomain[0]
        xstop = xdomain[1]
        ret = self._nearbyPromoters() + self._nearbyEnhancers()
        ret = [x for x in ret if x["start"] >= xstart and x["stop"] <= xstop]
        return {"data": ret}

    def _genesInRegion(self, start, stop):
        pos = self.coord()
        return self.pgSearch.genesInRegion(pos.chrom, int(start), int(stop))

    def _DEsForDisplay(self, nearbyDEs):
        ret = []
        for d in nearbyDEs:
            genename, strand = self.cache.lookupEnsembleGene(d[3])
            ret.append({"fc": round(float(d[2]), 3),
                        "gene": genename,
                        "start": d[0],
                        "stop": d[1],
                        "strand": strand,
                        "sstart": "{:,} ({})".format(d[0], strand)})
        return ret

    def nearbyDEs(self):
        # limb_14.5 from C57BL-6_limb_embryo_14.5_days
        ct1 = self.ct1.replace("C57BL/6_", "").replace("embryo_", "").replace("_days", "").replace("postnatal_", "")
        ct2 = self.ct2.replace("C57BL/6_", "").replace("embryo_", "").replace("_days", "").replace("postnatal_", "")

        cd = self.coord()

        pg = PGde(self.pgSearch.pw, self.assembly)
        nearbyDEs = pg.nearbyDEs(cd, self.halfWindow, ct1, ct2, 0.05)

        if not nearbyDEs:
            return {"data": None, "xdomain": None}

        # center on middle of DEs
        cxdomain = [max(0, min([d[0] for d in nearbyDEs])),
                    max([d[1] for d in nearbyDEs])]
        center = float(cxdomain[1] - cxdomain[0]) / 2 + cxdomain[0]
        halfWindow = max(self.halfWindow, (cxdomain[1] - cxdomain[0]) / 2.0)

        # widen each side
        xdomain = [max(0, center - halfWindow),
                   center + halfWindow]

        genes = self._genesInRegion(min(xdomain[0], cxdomain[0]),
                                    max(xdomain[1], cxdomain[1]))

        ret = self._DEsForDisplay(nearbyDEs)

        return {"names": self.names,
                "data": ret,
                "xdomain": xdomain,
                "genes": genes,
                "ymin": min([d["fc"] for d in ret]),
                "ymax": max([d["fc"] for d in ret])}

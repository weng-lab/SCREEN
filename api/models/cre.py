#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng




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

    def vista(self):
        return self.pgSearch.vista(self.accession)

    def nearbyGenesPA(self):
        coord = self.coord()
        if not self.genesAll or not self.genesPC:
            self.genesAll, self.genesPC = self.pgSearch.creGenes(self.accession,
                                                                 coord.chrom)
        pcGenes = set([g[0] for g in self.genesPC])
        retp = []; reta = []
        for g in self.genesPC:
            retp.append({"name": g[0], "distance": g[1], "ensemblid_ver": g[2], "chrom": g[3], "start": g[4], "stop": g[5]})
        for g in self.genesAll:
            reta.append({"name": g[0], "distance": g[1],
                         "ensemblid_ver": g[2], "chrom": g[3], "start": g[4], "stop": g[5]})
        retp.sort(key=lambda g: g["distance"])
        reta.sort(key=lambda g: g["distance"])
        return [ x["name"] for x in retp ][:3], [ x["name"] for x in reta ][:3]
    
    def nearbyGenes(self):
        coord = self.coord()
        if not self.genesAll or not self.genesPC:
            self.genesAll, self.genesPC = self.pgSearch.creGenes(self.accession,
                                                                 coord.chrom)
        pcGenes = set([g[0] for g in self.genesPC])
        ret = []
        for g in self.genesPC:
            ret.append({"name": g[0], "distance": g[1], "ensemblid_ver": g[2], "chrom": g[3], "start": g[4], "stop": g[5]})
        for g in self.genesAll:
            if g[0] not in pcGenes:
                ret.append({"name": g[0], "distance": g[1],
                            "ensemblid_ver": g[2], "chrom": g[3], "start": g[4], "stop": g[5]})
        ret.sort(key=lambda g: g["distance"])
        return ret

    def nearbyPcGenes(self):
        coord = self.coord()
        if not self.genesAll or not self.genesPC:
            self.genesAll, self.genesPC = self.pgSearch.creGenes(self.accession,
                                                                 coord.chrom)
        ret = []
        for g in self.genesPC:
            ret.append({"name": g[0], "distance": g[1], "ensemblid_ver": g[2],
                        "chrom": g[3], "start": g[4], "stop": g[5]})
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
                ret.append({"name": lookup[g]})
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
            self.ranks, self.group = self.pgSearch.creRanks(self.accession, coord.chrom)
        return self.ranks

    def _ctToTissue(self, ct):
        try:
            return self.cache.datasets.globalCellTypeInfo[ct]["tissue"]
        except:
            return ""

    def topTissues(self):
        # ['Enhancer', 'H3K4me3', 'H3K27ac', 'Promoter', 'DNase', 'Insulator', 'CTCF']
        proximal = self.nearbyGenes()[0]["distance"] < 2000
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
            ret = {}
            oneAssay = arrToCtDict(ranks[rm1.lower()], rmToCts[rm1])
            for ct, v in oneAssay.items():
                ret[ct] = {"tissue": self._ctToTissue(ct), rm1.lower(): v}
            return ret
        maxes = {
            "dnase": ranks["dnase_max"],
            "h3k4me3": ranks["h3k4me3_max"],
            "h3k27ac": ranks["h3k27ac_max"],
            "ctcf": ranks["ctcf_max"]
        }
        ranks = {"dnase": makeArrRanks("DNase"),
                 "h3k4me3": makeArrRanks("H3K4me3"),
                 "h3k27ac": makeArrRanks("H3K27ac"),
                 "ctcf": makeArrRanks("CTCF")
                 }
        ret = {}; rret = []
        for _, v in ranks.items():
            for ct, item in v.items():
                if ct not in ret:
                    ret[ct] = item
                else:
                    ret[ct].update(item)
        for ct, v in ret.items():
            for k, _ in ranks.items():
                if k not in v: v[k] = -11.0
            v["ct"] = ct
            v["group"] = self._group(v, proximal)
            rret.append(v)
        iranks = [{ k: v for k, v in maxes.items()}]
        iranks[0]["group"] = self.group # self._group(maxes, proximal)
        iranks[0]["title"] = "cell type agnostic"
        hasall = lambda x: x["dnase"] != -11.0 and x["ctcf"] != -11.0 and x["h3k4me3"] != -11.0 and x["h3k27ac"] != -11.0
        return {
            "typea": [ x for x in rret if hasall(x) ],
            "withdnase": [ x for x in rret if x["dnase"] != -11.0 and not hasall(x) ],
            "typec": [ x for x in rret if x["dnase"] == -11.0 ],
            "ranks": ranks, "iranks": iranks
        }

    def _group(self, v, p):
        igroup = self.group.split(',')[0]
        if v["dnase"] <= 1.64 and v["dnase"] != -11.0:
            return "ylowdnase"
        if igroup == "PLS":
            if v["h3k4me3"] > 1.64: return "PLS"
            if v["h3k27ac"] > 1.64: return "pELS"
        elif p:
            if v["h3k27ac"] > 1.64: return "pELS"
            if v["h3k4me3"] > 1.64: return "DNase-H3K4me3"
        else:
            if v["h3k27ac"] > 1.64: return "dELS"
            if v["h3k4me3"] > 1.64: return "DNase-H3K4me3"
        if v["ctcf"] > 1.64: return "ctcf"
        if -11.0 == v["dnase"]: return "zunclassified"
        return "dnase" if v["dnase"] > 1.64 else "ylowdnase"
    
    def peakIntersectCount(self, eset=None):
        coord = self.coord()
        if eset is None:
            eset = "peak"
        if not self.intersectCounts:
            self.intersectCounts = self.pgSearch.peakIntersectCount(self.accession, coord.chrom, self.cache.tfHistCounts[eset], eset=eset)
        return self.intersectCounts

    def linkedGenes(self):
        if "mm10" == self.assembly:
            return []
        return self.pgSearch.linkedGenes(self.accession)

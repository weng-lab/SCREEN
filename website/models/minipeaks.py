#!/usr/bin/env python

from __future__ import print_function

import os

from bigwig import BigWig
from cre import CRE

def asum(_l):
    ret = []
    for r in _l: ret += r
    return ret

class MiniPeaks:
    def __init__(self, pgSearch, accession, cache):
        self.pgSearch = pgSearch
        self.accession = accession
        self.cache = cache
        self.pos = None

    def _get_bigwigs(self):
        return [{"ct": k, "bigwig": v[1], "accession": v[0]}
                for k, v in self.cache.dnasemap.iteritems()]

    def _groupbytissue(self, results):
        tissuegroupings = {}
        for k, v in results.iteritems():
            if v["tissue"] not in tissuegroupings: tissuegroupings[v["tissue"]] = []
            tissuegroupings[v["tissue"]].append(k)
        return asum([v for k, v in tissuegroupings.iteritems()])

    def _get_bigwig_regions(self, bigwigs, elems):
        d = "/project/umw_zhiping_weng/0_metadata/encode/data"
        try:
            bfnps = []
            for bw in bigwigs:
                fnp = os.path.join(d, bw["accession"], bw["bigwig"] + ".bigWig")
                if os.path.exists(fnp):
                    bfnps.append({"path": fnp, "ct": bw["ct"], "tissue": self._ctToTissue(bw["ct"]) })

            regions = []
            for x in elems:
                regions.append({"acc": x["accession"],
                                "start": x["position"]["start"],
                                "end": x["position"]["end"],
                                "chr": x["position"]["chrom"]})

            results = BigWig.getregions(regions, bfnps, 50)
            results["order"] = self._groupbytissue(results)

            for bw in bigwigs:
                results[bw["ct"]]["max"] = self.cache.bigwigmaxes[bw["bigwig"]] if bw["bigwig"] in self.cache.bigwigmaxes else 0
            return results
        except:
            raise
            print("ERROR in _get_bigwig_regions")

    def _ctToTissue(self, ct):
        try:
            return self.cache.datasets.globalCellTypeInfo[ct]["tissue"]
        except:
            return ""

    def getBigWigRegions(self):
        coord = CRE(self.pgSearch, self.accession, self.cache).coord()
        bigWigs = self._get_bigwigs()
        me = {"accession": self.accession, "position": coord.toDict()}
        cres = [me]
        return (self._get_bigwig_regions(bigWigs, cres),
                [x["accession"] for x in cres])

    def getBigWigRegionsWithSimilar(self):
        coord = CRE(self.pgSearch, self.accession, self.cache).coord()
        bigWigs = self._get_bigwigs()
        me = {"accession": self.accession, "position": coord.toDict()}
        cres = [me] + self.pgSearch.creMostsimilar(self.accession, "dnase")
        return (self._get_bigwig_regions(bigWigs, cres),
                [x["accession"] for x in cres])

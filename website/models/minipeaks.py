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
        return [{"ct": k, "bigwig": v[1], "accession": v[0],
                 "tissue": self._ctToTissue(k) }
                for k, v in self.cache.dnasemap.iteritems()]

    def _groupbytissue(self, results):
        tissuegroupings = {}
        for k, v in results.iteritems():
            if v["tissue"] not in tissuegroupings: tissuegroupings[v["tissue"]] = []
            tissuegroupings[v["tissue"]].append(k)
        return asum([v for k, v in tissuegroupings.iteritems()])

    def _get_bigwig_regions(self, bigwigs, cres):
        try:
            results = BigWig(self.cache.minipeaks_cache).getregions(cres,
                                                                    bigwigs, 50)
            results["order"] = self._groupbytissue(results)
            return results
        except:
            raise
            print("ERROR in _get_bigwig_regions")

    def _ctToTissue(self, ct):
        try:
            return self.cache.datasets.globalCellTypeInfo[ct]["tissue"]
        except:
            print("missing tissue for", ct)
            return ""

    def getBigWigRegions(self):
        coord = CRE(self.pgSearch, self.accession, self.cache).coord()
        bigWigs = self._get_bigwigs()
        me = {"accession": self.accession,
              "chrom" : coord.chrom, "start" : coord.start, "end" : coord.end}
        cres = [me]
        regions = self._get_bigwig_regions(bigWigs, cres)
        accs = [x["accession"] for x in cres]
        return (regions, accs)

    def getBigWigRegionsWithSimilar(self):
        coord = CRE(self.pgSearch, self.accession, self.cache).coord()
        bigWigs = self._get_bigwigs()
        me = {"accession": self.accession,
              "chrom" : coord.chrom, "start" : coord.start, "end" : coord.end}
        cres = [me] + self.pgSearch.creMostsimilar(self.accession, "dnase")
        regions = self._get_bigwig_regions(bigWigs, cres)
        #print(regions[ regions.keys()[0] ])
        accs = [x["accession"] for x in cres]
        return (regions, accs)

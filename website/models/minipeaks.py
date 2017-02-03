#!/usr/bin/env python

from __future__ import print_function

import os
import sys

from bigwig import BigWig
from cre import CRE


sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import printt

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

    def _get_bigwigs(self, key):
        return [{"ct": k, "bigwig": v[1], "accession": v[0],
                 "tissue": self._ctToTissue(k) }
                for k, v in self.cache.assaymap[key].iteritems()]

    def _groupbytissue(self, results):
        tissuegroupings = {}
        for k, v in results.iteritems():
            if v["tissue"] not in tissuegroupings: tissuegroupings[v["tissue"]] = []
            tissuegroupings[v["tissue"]].append(k)
        return asum([v for k, v in tissuegroupings.iteritems()])

    def _get_bigwig_regions(self, bigwigs, cres, assay, n_bars = 15):
        print(cres)
        try:
            results = BigWig(self.cache.minipeaks_caches[assay]).getregions(cres,
                                                                            bigwigs, n_bars)
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

    def regionsFromSearchList(self, assay, cres, n_bars):
        for cre in cres:
            cre["end"] = cre["stop"]
        bigWigs = self._get_bigwigs(assay)
        regions = self._get_bigwig_regions(bigWigs, cres, assay, n_bars)
        accs = [x["accession"] for x in cres]
        return (regions, accs)
        
    def getBigWigRegions(self, assay, cres = None):
        coord = CRE(self.pgSearch, self.accession, self.cache).coord()
        bigWigs = self._get_bigwigs(assay)
        me = {"accession": self.accession,
              "chrom" : coord.chrom, "start" : coord.start, "end" : coord.end}
        if not cres:
            cres = [me]
        regions = self._get_bigwig_regions(bigWigs, cres, assay)
        accs = [x["accession"] for x in cres]
        return (regions, accs)

    def getBigWigRegionsWithSimilar(self, assay, other = None):
        print(assay)
        coord = CRE(self.pgSearch, self.accession, self.cache).coord()
        bigWigs = self._get_bigwigs(assay)
        me = {"accession": self.accession,
              "chrom" : coord.chrom, "start" : coord.start, "end" : coord.end}
        cres = [me] + self.pgSearch.creMostsimilar(self.accession, assay + ("_dnase" if assay != "dnase" else ""))
        regions = self._get_bigwig_regions(bigWigs, cres, assay)

        #print(regions[ regions.keys()[0] ])
        accs = [x["accession"] for x in cres]
        return (regions, accs)


def main():
    class DummyEs:
        def search(self, index, body):
            return {"hits": {"total": 0, "hits": [] }}
        def __init__(self):
            pass

    import sys, os
    sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
    sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
    sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
    from postgres_wrapper import PostgresWrapper
    from pg import PGsearch
    from elastic_search_wrapper import ElasticSearchWrapperWrapper
    from dbconnect import db_connect
    from cached_objects import CachedObjects

    DBCONN = db_connect(os.path.realpath(__file__), False)
    ps = PostgresWrapper(DBCONN)
    es = ElasticSearchWrapperWrapper(DummyEs())

    def chunks(l, n):
        """Yield successive n-sized chunks from l."""
        # from http://stackoverflow.com/a/312464
        for i in xrange(0, len(l), n):
            yield l[i:i + n]

    for assembly in ["hg19", "mm10"]:
        pgSearch = PGsearch(ps, assembly)
        cache = CachedObjects(es, ps, assembly)

        for accessions in list(chunks(pgSearch.allCREs(), 1000)):
            mp = MiniPeaks(pgSearch, accessions[0]["accession"], cache)
            mp.getBigWigRegions(accessions)
            printt(len(accessions))

if __name__ == "__main__":
    main()

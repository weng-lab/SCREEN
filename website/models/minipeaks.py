#!/usr/bin/env python

from __future__ import print_function

import os
import sys

from minipeaks_cache import MiniPeaksCache
from cre import CRE

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import printt

class MiniPeaks:
    def __init__(self, assembly, pgSearch, cache):
        self.assembly = assembly
        self.pgSearch = pgSearch
        self.cache = cache

    def getBigWigRegions(self, assay, accession, cres = []):
        accessions = [accession] + cres
         
        mps = MiniPeaksCache(self.assembly, 20, 2).get(assay, accessions)
        mp = mps[0]

        lookup = self.cache.datasets.byFileID
                
        ret = []
        for fileID, data in mp["data"].iteritems():
            lu = lookup[fileID]
            ret.append({"expID" : lu["expID"],
                        mp["accession"] : data,
                        mp["accession"] +  'avg' : mp["avgs"][fileID],
                        "tissue" : lu["tissue"],
                        "biosample_summary" : lu["biosample_summary"],
                        "biosample_type" : lu["biosample_type"]})
        ret.sort(key = lambda x: (x["tissue"], x["biosample_summary"]))
        return ret, accessions

    def getBigWigRegionsWithSimilar(self, assay, accession, other = None):
        coord = CRE(self.pgSearch, accession, self.cache).coord()
        sassay = ""
        if assay != "dnase":
            sassay += "_dnase" 
        cres = [accession] + self.pgSearch.creMostsimilar(accession, sassay)
        regions = MiniPeaksCache(self.assembly, 20, 2).get(assay, cres)
        return (regions, accs)

def main():
    import sys, os
    sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
    sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
    sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
    from postgres_wrapper import PostgresWrapper
    from pg import PGsearch
    from dbconnect import db_connect
    from cached_objects import CachedObjects

    DBCONN = db_connect(os.path.realpath(__file__), False)
    ps = PostgresWrapper(DBCONN)

    for assembly in ["hg19", "mm10"]:
        pgSearch = PGsearch(ps, assembly)
        cache = CachedObjects(es, ps, assembly)

if __name__ == "__main__":
    main()

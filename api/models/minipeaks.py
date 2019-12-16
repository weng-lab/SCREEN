#!/usr/bin/env python3


import os
import sys

from minipeaks_cache import MiniPeaksCache
from cre import CRE

sys.path.append(os.path.join(os.path.dirname(__file__), '../../utils/'))
from utils import printt


class MiniPeaks:
    def __init__(self, assembly, pgSearch, cache, nbins, ver):
        self.assembly = assembly
        self.pgSearch = pgSearch
        self.cache = cache
        self.nbins = nbins
        self.ver = ver

    def _getByAssay(self, assays, accessions):
        byAssay = {}
        mpc = MiniPeaksCache(self.assembly, self.nbins, self.ver)
        for assay in assays:
            byAssay[assay] = mpc.get(assay, accessions)
        return byAssay

    def getMinipeaksForAssays(self, assays, accessions):
        byAssay = self._getByAssay(assays, accessions)

        lookup = self.cache.datasets.byFileID

        byCts = {}
        for assay, accsAndData in byAssay.items():
            for accession, fileIdToData in accsAndData.items():
                for fileID, data in fileIdToData.items():
                    lu = lookup[fileID]
                    ctn = lu["cellTypeName"]
                    if ctn not in byCts:
                        byCts[ctn] = {"tissue": lu["tissue"],
                                      "biosample_summary": lu["biosample_summary"],
                                      "biosample_type": lu["biosample_type"],
                                      "cellTypeName": lu["cellTypeName"],
                                      "expIDs": []}
                    for a in assays:
                        k = accession + a
                        if k not in byCts[ctn]:
                            byCts[ctn][k] = None
                    k = accession + assay
                    byCts[ctn][k] = {"fileID": fileID, "data": data, "assay": assay}
                    expID = self.cache.datasets.byFileID[fileID]["expID"]
                    byCts[ctn]["expIDs"].append(expID)
        return list(byCts.values()), accessions

    def getBigWigRegionsWithSimilar(self, assay, accession, other=None):
        coord = CRE(self.pgSearch, accession, self.cache).coord()
        sassay = ""
        if assay != "dnase":
            sassay += "_dnase"
        cres = [accession] + self.pgSearch.creMostsimilar(accession, sassay)
        regions = MiniPeaksCache(self.assembly, self.nbins, self.ver).get(assay, cres)
        return (regions, accs)


def main():
    import sys
    import os
    sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
    sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
    sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
    from postgres_wrapper import PostgresWrapper
    from pg import PGsearch
    from dbconnect import db_connect
    from cached_objects import CachedObjects

    DBCONN = db_connect(os.path.realpath(__file__))
    ps = PostgresWrapper(DBCONN)

    assembly = "hg19"
    acc = "EH37E1055372"

    pgSearch = PGsearch(ps, assembly)
    cache = CachedObjects(ps, assembly)

    mp = MiniPeaks(assembly, pgSearch, cache, 0, 4)
    ret = mp.getMinipeaksForAssays(["dnase"], [acc])

    print(ret)


if __name__ == "__main__":
    main()

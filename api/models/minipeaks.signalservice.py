#!/usr/bin/env python3



import os
import sys
import grequests
import json
import math
import time

from .minipeaks_cache import MiniPeaksCache
from .cre import CRE

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import printt

POSTBODY = """curl 'https://api.staging.wenglab.org/graphql' -H 'Accept-Encoding: gzip, deflate, br' -H 'Content-Type: application/json' -H 'Accept: application/json' -H 'Connection: keep-alive' -H 'DNT: 1' -H 'Origin: https://api.staging.wenglab.org' --data-binary '{query}' --compressed"""

gquery = """query BigRequests($bigRequests: [BigRequest!]!) {
    bigRequests(requests: $bigRequests) {
        data,
        error
    }
}
"""

def _cbin(results, coord, nbins = 20):
    gbin = lambda start: math.floor( nbins * (start - coord["start"]) / (coord["end"] - coord["start"]) )
    scores = [ 0.0 for x in range(nbins) ]
    for result in results:
        ibin = int(gbin(result["start"]))
        if ibin < nbins and ibin >= 0: scores[ibin] += result["value"] * nbins * (result["end"] - result["start"]) / (coord["end"] - coord["start"])
    return scores

def _batch_load(accs, coord):
    treq = { "bigRequests": [] }
    for _, facc in accs:
        treq["bigRequests"].append({ "url": "https://www.encodeproject.org/files/{acc}/@@download/{acc}.bigWig".format(acc = facc), "chr1": coord["chrom"], "start": coord["start"], "end": coord["end"] })
    return { "query": gquery, "variables": treq }

def _process_response(accs, j, coord, nbins = 20):
    return { accs[i]: _cbin(j["data"]["bigRequests"][i]["data"], coord, nbins = nbins) for i in range(len(accs)) }

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

        accession = accessions[0]
        coord = CRE(self.pgSearch, accessions[0], self.cache).coord()
        coord = { "start": coord.start - 2000, "end": coord.end + 2000, "chrom": coord.chrom }

        faccs = []; fd = []; results = {}
        for assay, elist in self.cache.assaymap.items():
            for celltype, info in elist.items():
                _, facc = info
                faccs.append( (assay, facc) )
        for i in range(len(faccs) / 20 + 1):
            fd.append(faccs[i * 20 : (i + 1) * 20])
        requests = ( grequests.post("https://api.staging.wenglab.org/graphql", json = _batch_load(fde, coord))
                     for fde in fd[:8] )
        for i, response in enumerate(grequests.map(requests)):
            try:
                results.update(_process_response(fd[i], response.json(), coord, 40))
            except:
                print("batch %d failed" % i, file = sys.stderr)
                print(response.text, file = sys.stderr)
                     
        lookup = self.cache.datasets.byFileID
        byCts = {}
        
        for key, data in results.items():
            assay, fileID = key
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

    testCONN = db_connect(os.path.realpath(__file__))
    ps = PostgresWrapper(testCONN)

    assembly = "hg19"
    acc = "EH37E1055372"

    pgSearch = PGsearch(ps, assembly)
    cache = CachedObjects(ps, assembly)

    mp = MiniPeaks(assembly, pgSearch, cache, 0, 4)
    ret = mp.getMinipeaksForAssays(["dnase"], [acc])

    print(ret)


if __name__ == "__main__":
    main()

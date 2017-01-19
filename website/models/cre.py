#!/usr/bin/env python

from __future__ import print_function

class CRE:
    def __init__(self, pgSearch, accession):
        self.pgSearch = pgSearch
        self.accession = accession
        self.pos = None
        self.genesAll = None
        self.genesPC = None
        self.tad = None
        self.ranks = None

    def coord(self):
        if not self.pos:
            self.pos = self.pgSearch.crePos(self.accession)
        return self.pos

    def intersectingSnps(self, halfWindow):
        return self.pgSearch.intersectingSnps(self.coord(), halfWindow)

    def nearbyCREs(self, halfWindow):
        return self.pgSearch.nearbyCREs(self.accession, self.coord(), halfWindow)

    def nearbyGenes(self):
        coord = self.coord()
        if not self.genesAll or not self.genesPC:
            self.genesAll, self.genesPC = self.pgSearch.creGenes(self.accession,
                                                                 coord.chrom)
        ret = []
        for g in list(set(self.genesAll + self.genesPC)):
            ret.append({"name" : g[0], "distance" : g[1]})
        return ret

    def genesInTad(self):
        coord = self.coord()
        if self.tad is None:
            self.tad = self.pgSearch.creTad(self.accession, coord.chrom)
        return self.tad

    def allRanks(self):
        if not self.ranks:
            self.ranks = self.pgSearch.creRanks(self.accession, coord.chroms)
        return self.ranks

    def topTissues(self):
        ranks = self.allRanks()
        rmToIdxToCt = self.cache.rankMethodToIDxToCellType
        ctToTissue = self.cache.globalCellTypeInfo()

        return {"dnase": [{"tissue": self._tissue(k),
                           "cell_type": k,
                           "rank": v["rank"] } for k, v in ranks["dnase"].iteritems()],
                "promoter": [{"tissue": self._tissue(k),
                              "cell_type": k,
                              "H3K4me3": self._get_rank("H3K4me3-Only", v),
                              "H3K4me3_DNase": self._get_rank("DNase+H3K4me3", v) } for k, v in ranks["promoter"].iteritems()],

                "enhancer": [{"tissue": self._tissue(k),
                              "cell_type": k,
                              "H3K27ac": self._get_rank("H3K27ac-Only", v),
                              "H3K27ac_DNase": self._get_rank("DNase+H3K27ac", v) } for k, v in ranks["enhancer"].iteritems()],

                "ctcf": [{"tissue": self._tissue(k),
                          "cell_type": k,
                          "ctcf": self._get_rank("CTCF-Only", v),
                          "ctcf_DNase": self._get_rank("DNase+CTCF", v) } for k, v in ranks["ctcf"].iteritems()] }

#!/usr/bin/env python

from __future__ import print_function

class CRE:
    def __init__(self, pgSearch, accession):
        self.pgSearch = pgSearch
        self.accession = accession
        self.pos = None
        self.genesAll = None
        self.genesPC = None

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

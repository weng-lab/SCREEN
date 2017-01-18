#!/usr/bin/env python

from __future__ import print_function

class CRE:
    def __init__(self, pgSearch, accession):
        self.pgSearch = pgSearch
        self.accession = accession
        self.pos = None

    def coord(self):
        if not self.pos:
            self.pos = self.pgSearch.crePos(self.accession)
        return self.pos

    def intersectingSnps(self, halfWindow):
        return self.pgSearch.intersectingSnps(self.coord(), halfWindow)

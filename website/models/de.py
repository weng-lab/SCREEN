#!/usr/bin/env python

from __future__ import print_function

import os

class DE:
    def __init__(self, pgSearch, gene, leftName, rightName):
        self.pgSearch = pgSearch
        self.gene = None
        self.leftName = leftName
        self.rightName = rightName

    def coord(self):
        if not self.pos:
            self.pos = self.pgSearch.genePos(self.gene)
        return self.pos

    def nearbyCREs(self, halfWindow):
        return self.pgSearch.nearbyCREs(None, self.coord(), halfWindow)

    def nearbyDEs(self, halfWindow):
        coord = self.coord()
        return self.pgSearch.nearbyDEs(coord, halfWindow, self.leftName, self.rightName)

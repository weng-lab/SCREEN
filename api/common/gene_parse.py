#!/usr/bin/env python2

from __future__ import print_function
import sys
import os

from coord import Coord


class GeneParse:
    def __init__(self, assembly, r, s, useTss, tssDist):
        self.assembly = assembly
        self.s = s
        self.useTss = useTss
        self.tssDist = tssDist

        self.oname = r[0]
        self.strand = r[10]

        if useTss:
            if '+' == self.strand:
                self.coord = Coord(r[4], max(0, int(r[5]) - tssDist), r[6])
            else:
                self.coord = Coord(r[4], r[5], int(r[6]) + tssDist)
        else:
            self.coord = Coord(r[1], r[2], r[3])

        self.approved_symbol = r[9]
        self.sm = r[7]

    def toJson(self):
        return {"oname": self.oname,
                "approved_symbol": self.approved_symbol,
                "chrom": self.coord.chrom,
                "start": self.coord.start,
                "stop": self.coord.end,
                "strand": self.strand,
                "sm": self.sm,
                "searchLink": {
                    "approved_symbol": self.approved_symbol,
                    "coord_chrom": self.coord.chrom,
                    "coord_start": self.coord.start,
                    "coord_end": self.coord.end}
                }

    def get_genetext(self):
        if self.approved_symbol:
            gene = self.approved_symbol
        else:
            gene = self.oname

        ret = {"gene": gene,
               "useTss": self.useTss,
               "tssDist": self.tssDist,
               "assembly": self.assembly}
        return ret

#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng



import sys
import os

from coord import Coord


class GeneParse:
    def __init__(self, assembly, r, s, useTss, tssDist):
        self.assembly = assembly
        self.approved_symbol = r[9]
        self.s = s.replace(self.approved_symbol, "")
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

        self.sm = r[7]

    def toJson(self):
        return {"oname": self.oname,
                "approved_symbol": self.approved_symbol,
                "chrom": self.coord.chrom,
                "start": self.coord.start,
                "stop": self.coord.end,
                "strand": self.strand,
                "sm": self.sm
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

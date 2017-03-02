#!/usr/bin/env python

from __future__ import print_function
import sys
import os

from coord import Coord

class GeneParse:
    def __init__(self, assembly, r, s, usetss, tssdist):
        self.assembly = assembly
        self.s = s
        self.usetss = usetss
        self.tssdist = tssdist

        self.interpretation = r[0]
        if usetss:
            self.coord = Coord(r[4], int(r[5]) - tssdist, r[6])
        else:
            self.coord = Coord(r[1], int(r[2]) - tssdist, r[3])
        self.noTss = r[1] == r[4] and r[2] == r[5] and r[3] == r[6]
        self.approved_symbol = r[9]

    def get_genetext(self):
        if self.approved_symbol:
            gene = self.approved_symbol
        else:
            gene = self.interpretation

        def orjoin(a):
            return ", ".join(a[:-1]) + " or " + a[-1]
        gene = "<em>%s</em>" % gene

        if self.noTss:
            return "This search is showing cREs overlapping the gene body of {q}.".format(q=gene)

        if self.usetss:
            if not self.tssdist:
                return """
This search is showing candidate promoters located between the first and last TSS's of {q}.<br>
To see cREs overlapping the gene body of {q}, <a href='/search?q={q}&assembly={assembly}'>click here</a>.
""".format(q=gene, assembly=self.assembly)

            return """
This search is showing candidate promoters located between the first and last TSS's of {q} and up to {d} upstream.<br>
To see cREs overlapping the gene body of {q}, <a href='/search?q={q}&assembly={assembly}'>click here</a>.
""".format(q=gene, assembly=self.assembly, d=self.tssdist)

        dists = orjoin(["<a href='/search?q={q}+tssdist_{d}+promoter&assembly={assembly}'>{d}</a>".format(q=gene, assembly=self.assembly, d=d) for d in ["1kb", "2kb", "5kb", "10kb", "25kb", "50kb"]])

        return """
This search is showing cREs overlapping the gene body of {q}.<br>
To see candidate promoters located between the first and last TSS's of {q}, <a href='/search?q={q}+tss+promoter&assembly={assembly}'>click here</a>, <br />or click one of the following links to see candidate promoters within {dists} upstream of the TSSs.
""".format(q=gene, assembly=self.assembly, dists=dists)


#!/usr/bin/env python

from __future__ import print_function
import sys, os
import re

from coord import Coord
from pg_parse import PGparse

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession
from constants import chrom_lengths, chroms
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper

sys.path.append(os.path.join(os.path.dirname(__file__),
                             "../../../metadata/utils"))
from db_utils import getcursor

def _unpack_tuple_array(a):
    return ([i[0] for i in a], [i[1] for i in a])

class ParseSearch:
    def __init__(self, rawInput, DBCONN, assembly):
        self.rawInput = rawInput

        self.pg = PostgresWrapper(DBCONN)
        self.pgParse = PGparse(self.pg, assembly)

        self.halfWindow = 7500
        self.userErrMsg = ""

        self.assembly = assembly
        self._gene_tablename = self.assembly + "_gene_info"

    def _sanitize(self):
        # TODO: add more here!
        return self.rawInput[:2048]

    def parseStr(self):
        return self.sanitizedStr

    def find_celltypes_in_query(self, q):
        return [] #self.cell_type_query(q)

    def find_gene_in_q(self, q):
        p = q.split(" ")
        for i in xrange(len(p)):
            r = self.pgParse._gene_alias_to_coordinates(p[i])
            if r:
                return r
        return None


    def get_genetext(self, gene, tss = False, notss = False, dist=0):
        def orjoin(a):
            return ", ".join(a[:-1]) + " or " + a[-1]
        gene = "<em>%s</em>" % gene
        if notss:
            return "This search is showing cREs overlapping the gene body of {q}.".format(q=gene)
        if tss:
            if not dist:
                return """
This search is showing candidate promoters located between the first and last TSS's of {q}.<br>
To see cREs overlapping the gene body of {q}, <a href='/search?q={q}&assembly={assembly}'>click here</a>.
""".format(q=gene, assembly=self.assembly)
            return """
This search is showing candidate promoters located between the first and last TSS's of {q} and up to {d} upstream.<br>
To see cREs overlapping the gene body of {q}, <a href='/search?q={q}&assembly={assembly}'>click here</a>.
""".format(q=gene, assembly=self.assembly, d=dist)
        dists = orjoin(["<a href='/search?q={q}+tssdist_{d}+promoter&assembly={assembly}'>{d}</a>".format(q=gene, assembly=self.assembly, d=d) for d in ["1kb", "2kb", "5kb", "10kb", "25kb", "50kb"]])
        return """
This search is showing cREs overlapping the gene body of {q}.<br>
To see candidate promoters located between the first and last TSS's of {q}, <a href='/search?q={q}+tss+promoter&assembly={assembly}'>click here</a>, <br />or click one of the following links to see candidate promoters within {dists} upstream of the TSSs.
""".format(q=gene, assembly=self.assembly, dists=dists)

    def _try_find_celltype(self, s):
        pass

    def _find_coord(self, s):
        _p = s.split()
        for x in _p:
            # TODO: precompile re
            r = re.search("^[cC][hH][rR][0-9XYxy][0-9]?[\s]*[\:]?[\s]*[0-9,\.]+[\s\-]+[0-9,\.]+", x)
            if r:
                p = r.group(0).replace("-", " ").replace(":", " ").replace(",", "").replace(".", "").split()
                return (s.replace(r.group(0), "").strip(),
                        Coord(p[0].replace("x", "X").replace("y", "Y"),
                              p[1], p[2]))
        for x in _p:
            r = re.search("^[cC][hH][rR][0-9XYxy][0-9]?[\s]*[\:]?[\s]*[0-9,\.]+", x)
            if r:
                p = r.group(0).replace("-", " ").replace(":", " ").replace(",", "").replace(".", "").split()
                return (s.replace(r.group(0), "").strip(),
                        Coord(p[0].replace("x", "X").replace("y", "Y"),
                              p[1], int(p[1]) + 1))
        for x in _p:
            r = re.search("^[cC][hH][rR][0-9XxYy][0-9]?", x)
            if r:
                c = r.group(0).replace("x", "X").replace("y", "Y")
                return (s.replace(r.group(0), "").strip(),
                        Coord(c, 0, chrom_lengths[self.assembly][c]))
        return (s, None)


    def parse(self, kwargs = None):
        s = self._sanitize().lower()
        self.sanitizedStr = s

        s, coord = self._find_coord(s)
        toks = s.split()
        toks = [t.lower() for t in toks]
        usetss = "tss" in toks or (kwargs and "tss" in kwargs)
        tssdist = 0
        interpretation = None

        ret = {"cellType": None,
               "coord_chrom" : None,
               "coord_start" : None,
               "coord_end" : None,
               "element_type": None,
               "approved_symbol": None,
               "interpretation": None}
        if "promoter" in toks or usetss:
            ret["element_type"] = "promoter-like"
            ret["rank_promoter_start"] = 164
            ret["rank_dnase_start"] = 164
            ret["gene_all_end"] = 5000
            s = s.replace("promoter", "")
        elif "enhancer" in toks:
            ret["element_type"] = "enhancer-like"
            ret["rank_enhancer_start"] = 164
            ret["rank_dnase_start"] = 164
            s = s.replace("enhancer", "")
        elif "insulator" in toks:
            ret["element_type"] = "insulator-like"
            ret["rank_ctcf_start"] = 164
            s = s.replace("insulator", "")

        accessions = []
        try:
            for t in toks:
                if isaccession(t):
                    accessions.append(t)
                    s = s.replace(t, "")
                    continue
                elif t.startswith("rs"):
                    coord = self.pgParse._get_snpcoord(t)
                    s = s.replace(t, "")
                    if coord and not self.pgParse.has_overlap(coord):
                        interpretation = "NOTICE: %s does not overlap any cREs; displaying any cREs within 2kb" % t
                        coord = Coord(coord.chrom, coord.start - 2000, coord.end + 2000)
                elif t.startswith("tssdist"):
                    tssdist = t.split("_")[1]
                    usetss = True
        except:
            print("could not parse " + s)

        if coord is None:
            interpretation, coord, s, notss, _id = self.pgParse._try_find_gene(s, usetss, tssdist)
            if interpretation:
                ret["approved_symbol"] = self.pgParse._gene_id_to_symbol(_id)
                interpretation = self.get_genetext(ret["approved_symbol"] if ret["approved_symbol"] else interpretation, usetss, notss, tssdist)

        s, cellType, _interpretation = self.pgParse._find_celltype(s)

        if cellType is None:
            s, cellType, _interpretation = self.pgParse._find_celltype(s, True)

        if len(accessions) > 0:
            coord = None
            cellType = None
            interpretation = None

        ret["cellType"] = cellType
        ret["interpretation"] = interpretation
        if coord:
            ret["coord_chrom"] = coord.chrom
            ret["coord_start"] = coord.start
            ret["coord_end"] = coord.end
        ret["accessions"] = accessions
        return ret

def main():
    DBCONN = db_connect(os.path.realpath(__file__))

    assembly = "mm10"
    ps = PostgresWrapper(DBCONN)

    ps = ParseSearch("HBB", DBCONN, assembly)

    output = ps.parse()
    keys = sorted(output.keys())
    for k in keys:
        v = output[k]
        print(k + ':', v)
    print(ps.parseStr())

if __name__ == '__main__':
    main()

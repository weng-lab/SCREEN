#!/usr/bin/env python

from __future__ import print_function
import sys, os
import re

from coord import Coord
from pg_parse import PGparse

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose
from constants import chrom_lengths, chroms
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper

sys.path.append(os.path.join(os.path.dirname(__file__), "../.."))
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__),
                             "../../../metadata/utils"))
from db_utils import getcursor

def _unpack_tuple_array(a):
    return ([i[0] for i in a], [i[1] for i in a])

re_coord1 = re.compile("^[cC][hH][rR][0-9XYxy][0-9]?[\s]*[\:]?[\s]*[0-9,\.]+[\s\-]+[0-9,\.]+")
re_coord2 = re.compile("^[cC][hH][rR][0-9XYxy][0-9]?[\s]*[\:]?[\s]*[0-9,\.]+")
re_coord3 = re.compile("^[cC][hH][rR][0-9XxYy][0-9]?")

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

    def _find_coord(self, s):
        _p = s.split()
        for x in _p:
            # TODO: precompile re
            r = re_coord1.search(x)
            if r:
                p = r.group(0).replace("-", " ").replace(":", " ").replace(",", "").replace(".", "").split()
                return (s.replace(r.group(0), "").strip(),
                        Coord(p[0].replace("x", "X").replace("y", "Y"),
                              p[1], p[2]))
        for x in _p:
            r = re_coord2.search(x)
            if r:
                p = r.group(0).replace("-", " ").replace(":", " ").replace(",", "").replace(".", "").split()
                return (s.replace(r.group(0), "").strip(),
                        Coord(p[0].replace("x", "X").replace("y", "Y"),
                              p[1], int(p[1]) + 1))
        for x in _p:
            r = re_coord3.search(x)
            if r:
                c = r.group(0).replace("x", "X").replace("y", "Y")
                return (s.replace(r.group(0), "").strip(),
                        Coord(c, 0, chrom_lengths[self.assembly][c]))
        return (s, None)


    def parse(self, kwargs = None):
        s = self._sanitize().strip()
        self.sanitizedStr = s

        s, coord = self._find_coord(s)
        toks = s.split()
        toks = [t.lower() for t in toks]
        useTss = "tss" in toks or (kwargs and "tss" in kwargs)
        tssDist = 0
        interpretation = None

        ret = {"cellType": None,
               "coord_chrom" : None,
               "coord_start" : None,
               "coord_end" : None,
               "element_type": None,
               "approved_symbol": None,
               "interpretation": None}
        if "promoter" in toks or useTss:
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
                        coord = Coord(coord.chrom,
                                      max(0, coord.start - 2000),
                                      coord.end + 2000)
                elif t.startswith("tssdist"):
                    tssDist = t.split("_")[1]
                    useTss = True
        except:
            print("could not parse " + s)

        genes = []
        if coord is None:
            genes = self.pgParse.try_find_gene(s, useTss, tssDist)
            if genes:
                g = genes[0]
                interpretation = g.get_genetext()
                coord = g.coord
                s = g.s

        s, cellType, _interpretation = self.pgParse._find_celltype(s)

        if cellType is None:
            s, cellType, _interpretation = self.pgParse._find_celltype(s, True)

        if len(accessions) > 0:
            coord = None
            cellType = None
            interpretation = None

        ret["assembly"] = self.assembly
        ret["cellType"] = cellType
        ret["interpretation"] = interpretation
        if coord:
            ret["coord_chrom"] = coord.chrom
            ret["coord_start"] = coord.start
            ret["coord_end"] = coord.end
        ret["accessions"] = accessions
        ret["multipleGenes"] = len(genes) > 1
        ret["genes"] = [g.toJson() for g in genes]
        return ret

def main():
    DBCONN = db_connect(os.path.realpath(__file__))

    assembly = "hg19"
    ps = PostgresWrapper(DBCONN)

    queries = ["BAP1", "HBB", "Actin alpha 1", "chr1:10-100"]
    queries = ["BAP1"]
    queries = ["Actin alpha 1", "HBB"]
    queries = ["HBB"]

    for q in queries:
        print("***************", q)
        ps = ParseSearch(q, DBCONN, assembly)

        output = ps.parse()
        keys = sorted(output.keys())
        for k in keys:
            v = output[k]
            if "genes" == k:
                for g in v:
                    print(g)
            else:
                print(k + ':', v)
        print(ps.parseStr())

if __name__ == '__main__':
    main()

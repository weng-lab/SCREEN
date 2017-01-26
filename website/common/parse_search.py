#!/usr/bin/env python

import sys
from coord import Coord

def _unpack_tuple_array(a):
    return ([i[0] for i in a], [i[1] for i in a])

def isaccession(s):
    s = s.lower()
    return (s.startswith("eh37e") or s.startswith("em10e") and len(s) == 12)

class ParseSearch:
    def __init__(self, rawInput, es, assembly):
        self.es = es
        self.rawInput = rawInput

        self.halfWindow = 7500
        self.userErrMsg = ""

        self.assembly = assembly

    def _sanitize(self):
        # TODO: add more here!
        return self.rawInput[:2048]

    def parseStr(self):
        return self.sanitizedStr

    def find_celltypes_in_query(self, q):
        return self.es.cell_type_query(q)

    def parse(self, comparison = False):
        s = self._sanitize()
        self.sanitizedStr = s
        toks = s.split()
        toks = [t.lower() for t in toks]

        coord = None
        cellTypes = self.find_celltypes_in_query(s)

        gene_suggestions, gene_results = self.es.gene_aliases_to_coordinates(s)
        gene_toks, gene_coords = _unpack_tuple_array(gene_results)
        snp_suggestions, snp_results = self.es.snp_aliases_to_coordinates(s)
        snp_toks, snp_coords = _unpack_tuple_array(snp_results)
        accessions = []

        if len(snp_coords) > 0:
            coord = Coord.parse(snp_coords[-1])
            coord.resize(self.halfWindow)
        if len(gene_coords) > 0:
            coord = Coord.parse(gene_coords[-1])

        try:
            for t in toks:
                print(t)
                if t.startswith("chr"):
                    # coordinate
                    coord = Coord.parse(t)
                    continue
                elif isaccession(t):
                    accessions.append(t)
                    continue
        except:
            raise
            print("could not parse " + s)

        print(gene_coords)

        if "promoter" in toks:
            ret["range_preset"] = "promoter"
        elif "enhancer" in toks:
            ret["range_preset"] = "enhancer"
        elif "insulator" in toks:
            ret["range_preset"] = "insulator"

        ct = None
        if len(cellTypes) > 0:
            ct = cellTypes[0].replace(" ", "_")
        ret = {"cellType": ct,
               "coord_chrom" : None,
               "coord_start" : None,
               "coord_end" : None,
               "range_preset": None}

        print(coord, ret["cellType"])
        if coord:
            ret["coord_chrom"] = coord.chrom
            ret["coord_start"] = coord.start
            ret["coord_end"] = coord.end
        ret["accessions"] = accessions
        return ret

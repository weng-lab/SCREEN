#!/usr/bin/env python

import nltk
#sentence = """At eight o'clock on Thursday morning  Arthur didn't feel very good."""
#tokens = nltk.word_tokenize(sentence)
#print tokens

from coord import Coord

def _unpack_tuple_array(a):
    return ([i[0] for i in a], [i[1] for i in a])

class ParseSearch:
    def __init__(self, rawInput, es):
        self.es = es
        self.rawInput = rawInput

        self.halfWindow = 7500
        self.userErrMsg = ""

        self.assembly = "hg19"

        self.cellTypes = {"hela-s3" : "HeLa-S3",
                          "k562" : "K562",
                          "gm12878" : "GM12878"}

    def _sanitize(self):
        # TODO: add more here!
        return self.rawInput[:2048]

    def parse(self):
        s = self._sanitize()
        toks = s.split()
        toks = [t.lower() for t in toks]

        coord = None
        cellType = None

        gene_suggestions, gene_results = self.es.gene_aliases_to_coordinates(s)
        gene_toks, gene_coords = _unpack_tuple_array(gene_results)
        snp_suggestions, snp_results = self.es.snp_aliases_to_coordinates(s)
        snp_toks, snp_coords = _unpack_tuple_array(snp_results)

        try:
            for t in toks:
                print(t)
                if t in self.cellTypes:
                    cellType = self.cellTypes[t]
                    continue
                elif t.startswith("chr"):
                    # coordinate
                    coord = Coord.parse(t)
                    continue
        except:
            raise
            print("could not parse " + s)

        print(gene_coords)
            
        if len(snp_coords) > 0:
            coord = Coord.parse(snp_coords[-1])
            coord.resize(self.halfWindow)
        if len(gene_coords) > 0:
            coord = Coord.parse(gene_coords[-1])

        print(coord, cellType)
        ret = {"cellType" : None, "coord" : None}
        if cellType:
            ret.update({"cellType" : cellType})
        if coord:
            ret.update({"coord" : {"chrom" : coord.chrom,
                                   "start" : coord.start,
                                   "end" : coord.end}})
        return ret

#!/usr/bin/env python

import nltk
#sentence = """At eight o'clock on Thursday morning  Arthur didn't feel very good."""
#tokens = nltk.word_tokenize(sentence)
#print tokens

from coord import Coord
from dbsnps import dbSnps
from genes import LookupGenes

def _unpack_tuple_array(a):
    return ([i[0] for i in a], [i[1] for i in a])

class ParseSearch:
    def __init__(self, DBCONN, rawInput, es):
        self.es = es
        self.rawInput = rawInput
        self.DBCONN = DBCONN
        self.dbSnps = dbSnps(DBCONN)
        self.genes = LookupGenes(DBCONN)

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

        gene_suggestions, gene_results = es.gene_aliases_to_coordinates(s)
        gene_toks, gene_coords = _unpack_tuple_array(gene_results)
        snp_suggestions, snp_results = es.snp_aliases_to_coordinates(s)
        snp_toks, snp_coords = _unpack_tuple_array(snp_results)
        
        try:
            for t in toks:
                print(t)
                if t in gene_toks:
                    coord = Coord.parse(gene_coords[gene_toks.index(t)])
                    continue
                elif t in snp_toks:
                    coord = Coord.parse(snp_coords[snp_toks.index(t)]).resize(self.halfWindow)
                    continue
                elif t in self.cellTypes:
                    cellType = self.cellTypes[t]
                    continue
                elif t.startswith("chr"):
                    # coordinate
                    coord = Coord.parse(t)
                    continue
                elif t.startswith("rs"):
                    coord = self.parseSnp(t)
                    continue
                else:
                    coord = self.parseGene(t)
        except:
            raise
            print("could not parse " + s)

        print(coord, cellType)
        ret = {"cellType" : None, "coord" : None}
        if cellType:
            ret.update({"cellType" : cellType})
        if coord:
            ret.update({"coord" : {"chrom" : coord.chrom,
                                   "start" : coord.start,
                                   "end" : coord.end}})
        return ret

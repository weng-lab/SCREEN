#!/usr/bin/env python

from __future__ import print_function
import ujson as json
import sys
import os
import requests
import gzip
import argparse

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets
from get_tss import Genes

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms

class GeneInfo:
    def __init__(self, assembly):
        self.assembly = assembly
        self.gene_files = paths.gene_files

    def getGeneCoords(self):
        if self.assembly not in self.gene_files:
            print("WARNING: cannot get gene coordinates for assembly",
                  self.assembly, "-- no gene file found")
            return
        fnp, filetype = self.gene_files[self.assembly]
        ggff = Genes(fnp, filetype)
        ret = {}
        for g in ggff.getGenes():
            ret[g.genename_] = "%s:%s-%s" % (g.chr_, g.start_, g.end_)
        return ret

    def tryparse(self, coord):
        if "-" not in coord or ":" not in coord:
            return {"chrom": "",
                    "start": -1,
                    "end": -1 }
        p = coord.split(":")
        v = p[1].split("-")
        return {"chrom": p[0],
                "start": int(v[0]),
                "end": int(v[1]) }

    def _parseLineHg19(self, line):
        line = line.strip().split("\t")
        while len(line) < 19:
            line.append("")
        g = {"ensemblid": line[9].strip(),
             "HGNC_ID": line[0],
             "approved_symbol": line[1],
             "approved_name": line[2],
             "previous_symbols": line[4].split(","),
             "synonyms": line[5].split(","),
             "accession_numbers": line[7],
             "RefSeq_ID": line[10],
             "UniProt_ID": line[14],
             "Vega_ID": line[16],
             "UCSC_ID": line[17],
             "mouse_genome_ID": line[18] }
        return g

    def processGeneListHg19(self):
        print(self.assembly, "getting gene coordinates...")
        geneCoords = self.getGeneCoords()
        inFnp = paths.genelist[self.assembly]
        outFnp = paths.genelsj[self.assembly]
        skipped = 0
        counter = 0

        print(self.assembly, "processing genelist...")
        with open(inFnp, "r") as f:
            with open(outFnp, "wb") as o:
                header = f.readline()
                for line in f:
                    g = self._parseLineHg19(line)
                    if "" == g["ensemblid"]:
                        skipped += 1
                        continue
                    if g["approved_symbol"] in geneCoords:
                        g["coordinates"] = geneCoords[g["approved_symbol"]]
                        g["position"] = self.tryparse(g["coordinates"])
                    o.write(json.dumps(g) + "\n")
                    counter += 1
        print("wrote", outFnp)
        print("\twrote", counter, "and skipped", skipped)

    def _parseLineMm10(self, g):
        eid = g.geneid_.split('.')[0]
        gn = g.genename_
        # TODO: fixme!
        return {"ensemblid": eid,
                "HGNC_ID": gn,
                "approved_symbol": gn,
                "approved_name": gn,
                "previous_symbols": gn,
                "synonyms": gn,
                "accession_numbers": gn,
                "RefSeq_ID": gn,
                "UniProt_ID": gn,
                "Vega_ID": gn,
                "UCSC_ID": gn,
                "mouse_genome_ID": gn }

    def processGeneListMm10(self):
        outFnp = paths.genelsj[self.assembly]
        skipped = 0
        counter = 0

        fnp, filetype = paths.gene_files[self.assembly]
        ggff = Genes(fnp, filetype)
        outFnp = paths.genelsj[self.assembly]
        with open(outFnp, "wb") as o:
            for gene in ggff.getGenes():
                g = self._parseLineMm10(gene)
                if "" == g["ensemblid"]:
                    skipped += 1
                    continue
                o.write(json.dumps(g) + "\n")
                counter += 1
        print("wrote", outFnp)
        print("\twrote", counter, "and skipped", skipped)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--version', type=int, default=7)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    # hg19
    gi = GeneInfo("hg19")
    gi.processGeneListHg19()

    # mm10
    gi = GeneInfo("mm10")
    gi.processGeneListMm10()

    return 0

if __name__ == "__main__":
    sys.exit(main())

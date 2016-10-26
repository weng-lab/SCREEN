#!/usr/bin/env python

from __future__ import print_function
import json
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

    def get_gene_map(self):
        if self.assembly not in self.gene_files:
            print("WARNING: cannot get gene coordinates for assembly",
                  self.assembly, "-- no gene file found")
            return
        fnp, filetype = self.gene_files[self.assembly]
        ggff = Genes(fnp, filetype)
        retval = {}
        for gene in ggff.getGenes():
            retval[gene.genename_] = "%s:%s-%s" % (gene.chr_, gene.start_, gene.end_)
        return retval

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

    def processGeneList(self):
        emap = {}
        skipped = 0

        print(self.assembly, "getting gene coordinates...")
        gene_map = self.get_gene_map()

        print(self.assembly, "processing genelist...")
        with open(paths.genelist[self.assembly], "r") as f:
            with open(paths.genelsj[self.assembly], "wb") as o:
                for idx, line in enumerate(f):
                    if idx == 0:
                        continue
                    line = line.strip().split("\t")
                    while len(line) < 19:
                        line.append("")
                    geneobj = {"ensemblid": line[9].strip(),
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
                    emap[geneobj["ensemblid"]] = geneobj["approved_symbol"]
                    if geneobj["ensemblid"] == "":
                        skipped += 1
                        continue
                    if geneobj["approved_symbol"] in gene_map:
                        geneobj["coordinates"] = gene_map[geneobj["approved_symbol"]]
                        geneobj["position"] = self.tryparse(geneobj["coordinates"])
                    o.write(json.dumps(geneobj) + "\n")
        print("wrote", paths.genelsj[self.assembly])
        print("skipped", skipped)
        with open(paths.geneJsonFnp[self.assembly], 'w') as f:
            json.dump(emap, f)
        print("wrote", paths.geneJsonFnp[self.assembly])
        return emap

    def getGeneList(self):
        fnp = paths.geneJsonFnp[self.assembly]
        if os.path.exists(fnp):
            with open(fnp) as f:
                emap = json.load(f)
            print("loaded from", fnp)
            return emap

        return self.processGeneList()

def rewrite(inFnp, outFnp, emap):
    print("rewriting", os.path.basename(inFnp),
          ": converting ensembl IDs to gene symbols",
          "and fixing cell line names")

    with gzip.open(inFnp, "r") as f:
        with gzip.open(outFnp, "w") as o:
            for idx, line in enumerate(f):
                if idx % 1000 == 0:
                    print(inFnp, "working with entry", idx)
                d = json.loads(line)

                for geneCat in ["nearest-pc", "nearest-all"]:
                    gpca = []
                    for gi in xrange(5):
                        g = d["genes"][geneCat][gi]
                        pc = g["gene-name"].split(".")[0]
                        if pc in emap:
                            g["gene-name"] = emap[pc]
                        gpca.append(g)
                    d["genes"][geneCat] = gpca

                for rk in ["ctcf", "dnase", "promoter", "enhancer"]:
                    cts = d["ranks"][rk].keys()
                    for ct in cts:
                        nct = ct.replace('.', '_')
                        if nct != ct:
                            d["ranks"][rk][nct] = d["ranks"][rk].pop(ct)

                o.write(json.dumps(d) + "\n")
    print("wrote", outFnp)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--version', type=int, default=7)
    parser.add_argument('--assembly', type=str, default="hg19")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    gi = GeneInfo("hg19")
    emap = gi.getGeneList()

    fnps = paths.get_paths(args.version, chroms[args.assembly])

    jobs = []
    for i in xrange(len(fnps["origFnp"])):
        jobs.append((fnps["origFnp"][i], fnps["rewriteFnp"][i], emap))
    ret = Parallel(n_jobs = args.j)(delayed(rewrite)(*job) for job in jobs)

    print("wrote %d gene objects less %d skipped" % (i, skipped))
    return 0

if __name__ == "__main__":
    sys.exit(main())

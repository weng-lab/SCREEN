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

_gene_files = paths.gene_files

def get_gene_map(assembly="hg19"):
    if assembly not in _gene_files:
        print("WARNING: cannot get gene coordinates for assembly %s: no gene file found" % assembly)
        return
    fnp, filetype = _gene_files[assembly]
    ggff = Genes(fnp, filetype)
    retval = {}
    for gene in ggff.getGenes():
        retval[gene.genename_] = "%s:%s-%s" % (gene.chr_, gene.start_, gene.end_)
    return retval

def ensembl_to_symbol(inFnp, outFnp, emap):
    print("rewriting", inFnp, ": converting ensembl IDs to gene symbols",
          "and fixing cell line names")
    i = 0
    with gzip.open(inFnp, "r") as f:
        with gzip.open(outFnp, "w") as o:
            for line in f:
                if i % 100000 == 0:
                    print("working with entry %d\r" % i, end = "")
                sys.stdout.flush()
                i += 1
                d = json.loads(line)

                for geneCat in ["nearest-pc", "nearest-all"]:
                    gpca = []
                    for gi in xrange(0, 5):
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

def tryparse(coordinate):
    if "-" not in coordinate or ":" not in coordinate:
        return {"chrom": "",
                "start": -1,
                "end": -1 }
    p = coordinate.split(":")
    v = p[1].split("-")
    return {"chrom": p[0],
            "start": int(v[0]),
            "end": int(v[1]) }

def processGeneList():
    emap = {}
    skipped = 0

    print("getting gene coordinates...")
    hg19_genes = get_gene_map("hg19")

    print("processing genelist...")
    with open(paths.genelist, "r") as f:
        with open(paths.genelsj, "wb") as o:
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
                if geneobj["approved_symbol"] in hg19_genes:
                    geneobj["coordinates"] = hg19_genes[geneobj["approved_symbol"]]
                    geneobj["position"] = tryparse(geneobj["coordinates"])
                o.write(json.dumps(geneobj) + "\n")
    print("wrote", paths.genelsj)
    print("skipped", skipped)
    with open(paths.geneJsonFnp, 'w') as f:
        json.dump(emap, f)
    print("wrote", paths.geneJsonFnp)
    return emap

def getGeneList():
    if os.path.exists(paths.geneJsonFnp):
        with open(paths.geneJsonFnp) as f:
            emap = json.load(f)
        print("loaded from", paths.geneJsonFnp)
    else:
        emap = processGeneList()
    return emap

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--version', type=int, default=7)
    parser.add_argument('--assembly', type=str, default="hg19")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    emap = getGeneList()

    fnps = paths.get_paths(args.version, chroms[args.assembly])

    jobs = []
    for i in xrange(len(fnps["origFnp"])):
        jobs.append((fnps["origFnp"][i], fnps["rewriteFnp"][i], emap))
    ret = Parallel(n_jobs = args.j)(delayed(ensembl_to_symbol)(*job) for job in jobs)

    print("wrote %d gene objects less %d skipped" % (i, skipped))
    return 0

if __name__ == "__main__":
    sys.exit(main())

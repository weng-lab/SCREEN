#!/usr/bin/env python

from __future__ import print_function
import json
import sys
import os
import requests
import gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets
from get_tss import Genes

_gene_files = {"hg19": (Dirs.GenomeFnp("gencode.v19/gencode.v19.annotation.gff3.gz"), "gff")}

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

def ensembl_to_symbol(fnp, emap):
    print("converting ensembl IDs to gene symbols")
    i = 0
    with gzip.open(fnp, "r") as f:
        with gzip.open(fnp.replace(".V2.", ".V2.genenames."), "w") as o:
            for line in f:
                if i % 100000 == 0: print("working with entry %d\r" % i, end = "")
                sys.stdout.flush()
                i += 1
                d = json.loads(line)
                pc = d["genes"]["nearest-pc"]["gene-id"].split(".")[0]
                an = d["genes"]["nearest-all"]["gene-id"].split(".")[0]
                d["genes"]["nearest-pc"]["gene-name"] = None
                d["genes"]["nearest-all"]["gene-name"] = None
                if pc in emap:
                    d["genes"]["nearest-pc"]["gene-name"] = emap[pc]
                if an in emap:
                    d["genes"]["nearest-all"]["gene-name"] = emap[an]
                o.write(json.dumps(d) + "\n")
    os.rename(fnp.replace(".V2.", ".V2.genenames."), fnp)

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


def main():
    infnp = os.path.join(Dirs.encyclopedia, "Version-4", "genelist.tsv")
    outfnp = os.path.join(Dirs.encyclopedia, "Version-4", "genelist.lsj")
    emap = {}
    
    i = -1
    skipped = 0

    print("getting gene coordinates...")
    hg19_genes = get_gene_map("hg19")

    print("processing genelist...")
    with open(infnp, "r") as f:
        with open(outfnp, "wb") as o:
            for line in f:
                i += 1
                if i == 0: continue
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

    ensembl_to_symbol(os.path.join(Dirs.encyclopedia, "Version-4", "regulatory-element-registry-hg19.V2.json.gz"),
                      emap)
                
    print("wrote %d gene objects less %d skipped" % (i, skipped))
    return 0

if __name__ == "__main__":
    sys.exit(main())

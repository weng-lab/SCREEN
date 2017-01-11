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

    def getGeneList(self):
        fnp = paths.geneJsonFnp[self.assembly]
        if os.path.exists(fnp):
            with open(fnp) as f:
                emap = json.load(f)
            print("loaded from", fnp)
            return emap
        raise Exception("missing", fnp)

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

                ret = []
                for g in d["proximal-genes"]:
                    ensembl = g.split('.')[0]
                    if ensembl in emap:
                        ret.append(emap[ensembl])
                    else:
                        ret.append(g)
                d["proximal-genes"] = ret
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

    gi = GeneInfo(args.assembly)
    emap = gi.getGeneList()

    jobs = [(paths.re_json_vers[args.version]["tssFnp"],
             paths.re_json_vers[args.version]["rewriteTssFnp"],
             emap)]
    ret = Parallel(n_jobs = args.j)(delayed(rewrite)(*job) for job in jobs)

    return 0

if __name__ == "__main__":
    sys.exit(main())

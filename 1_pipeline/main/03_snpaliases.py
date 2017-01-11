#!/usr/bin/env python

from __future__ import print_function
import ujson as json
import sys
import os
import requests
import gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets

sys.path.append("../../common")
from constants import paths

def main():
    for assembly in ["hg19", "mm10"]:
        print("working with assembly", assembly)
        inFnp = paths.snp_csvs[assembly]
        outFnp = paths.snp_lsjs[assembly]

        with open(inFnp, "r") as f:
            with gzip.open(outFnp, "wb") as o:
                header = f.readline()
                for line in f:
                    line = line.split(",")
                    s = {"accession": line[3].strip(),
                         "position": {"chrom": line[0],
                                      "start": int(line[1]),
                                      "end": int(line[2]) }}
                    o.write(json.dumps(s) + "\n")
        print("wrote", outFnp)
    return 0

if __name__ == "__main__":
    sys.exit(main())

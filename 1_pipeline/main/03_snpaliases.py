#!/usr/bin/env python

from __future__ import print_function
import json
import sys
import os
import requests
import gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets

sys.path.append("../../common")
from constants import paths

def main():
    component_fnps = paths.snp_csvs
    outfnp = paths.snp_lsj

    with gzip.open(outfnp, "wb") as o:
        for assembly, infnp in component_fnps:
            print("working with assembly %s" % assembly)
            with open(infnp, "r") as f:
                lines = [line for line in f]
                for line in lines[1:]:
                    line = line.split(",")
                    snpobj = {"accession": line[3].strip(),
                              "position": {"chrom": line[0],
                                           "start": int(line[1]),
                                           "end": int(line[2]) },
                              "assembly": assembly }
                    o.write(json.dumps(snpobj) + "\n")
    return 0

if __name__ == "__main__":
    sys.exit(main())

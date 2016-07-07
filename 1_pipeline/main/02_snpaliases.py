from __future__ import print_function
import json
import sys
import os
import requests

sys.path.append("../../../metadata/utils")
from files_and_paths import Dirs, Tools, Genome, Datasets

def main():
    encyclopedia_dir = os.path.join(Dirs.encyclopedia, "Version-4")
    
    component_fnps = [("mm9", os.path.join(Dirs.dbsnps, "snps128common.mm9.csv")),
                      ("mm10", os.path.join(Dirs.dbsnps, "snps142common.mm10.csv")),
                      ("hg19", os.path.join(Dirs.dbsnps, "snps144common.hg19.csv"))]
    outfnp = os.path.join(encyclopedia_dir, "snplist.lsj")
    
    with open(outfnp, "wb") as o:
        for assembly, infnp in component_fnps:
            print("working with assembly %s" % assembly)
            with open(infnp, "r") as f:
                lines = [line for line in f]
                for line in lines[1:]:
                    line = line.split(",")
                    snpobj = {"accession": line[3],
                               "coordinates": "%s:%s-%s" % (line[0], line[1], line[2]),
                               "assembly": assembly }
                    o.write(json.dumps(snpobj) + "\n")
    return 0

if __name__ == "__main__":
    sys.exit(main())

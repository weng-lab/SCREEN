#!/usr/bin/env python

from __future__ import print_function

import os
import sys
import gzip

class Cytoband:
    def __init__(self, fnp):
        _open = open if not fnp.endswith(".gz") else gzip.open
        self.bands = {}
        with _open(fnp, "r") as f:
            for line in f:
                p = line.strip().split("\t")
                if p[0] not in self.bands:
                    self.bands[p[0]] = []
                if "gpos" in p[4]:
                    self.bands[p[0]].append({"start": int(p[1]),
                                             "end": int(p[2]),
                                             "feature": p[4],
                                             "color": float(p[4].replace("gpos", "")) / 101.0 })
                else:
                    self.bands[p[0]].append({"start": int(p[1]),
                                             "end": int(p[2]),
                                             "feature": p[4] })
                
def main():
    fn = "ucsc.mm10.cytoBand.txt.gz"
    fn = "ucsc.hg19.cytoBand.txt.gz"
    fnp = os.path.join("/home/mjp/0_metadata/encyclopedia/Version-4/", fn)
    
    cb = Cytoband(fnp)

    for chrom, bands in cb.bands.iteritems():
        print(chrom, len(bands), bands[0])

if __name__ == "__main__":
    sys.exit(main())

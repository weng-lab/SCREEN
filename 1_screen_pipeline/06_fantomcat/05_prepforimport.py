from __future__ import print_function

import sys, os

from fc_common import FCPaths

class PrepImport:
    
    def __init__(self):
        m = {}
        with open(FCPaths.genebed, "r") as f:
            for line in f:
                line = line.strip().split("\t")
                m[line[3]] = line[:3]
        
        with open(FCPaths.genetsv, "r") as t:
            t.readline() # skip header
            with open(FCPaths.forimport["genes"], "wb") as o:
                while True:
                    _b = t.readline().strip().split("\t")
                    if len(_b) <= 1: break
                    b = [_b[i] if _b[i] != "" or i <= 5 else "NaN" for i in xrange(len(_b))] + ["NaN" for i in xrange(11 - len(_b))]
                    if b[0] not in m:
                        print("WARNING: no coordinates for %s; skipping" % b[0])
                        continue
                    o.write("\t".join(m[b[0]] + b) + "\n")
        with open(FCPaths.intersected, "r") as f:
            with open(FCPaths.forimport["intersections"], "wb") as o:
                for line in f:
                    p = line.strip().split("\t")
                    o.write("\t".join((p[3], p[8])) + "\n")
        with open(FCPaths.twokb_intersected, "r") as f:
            with open(FCPaths.forimport["twokb_intersections"], "wb") as o:
                for line in f:
                    p = line.strip().split("\t")
                    o.write("\t".join((p[3], p[8])) + "\n")

def main():
    PrepImport()
    return 0

if __name__ == "__main__":
    sys.exit(main())

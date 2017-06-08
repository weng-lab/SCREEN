from __future__ import print_function

import sys, os

from fc_common import FCPaths

class PrepImport:
    
    def __init__(self):
        with open(FCPaths.genebed, "r") as f:
            with open(FCPaths.genetsv, "r") as t:
                t.readline() # skip header
                with open(FCPaths.forimport["genes"], "wb") as o:
                    while True:
                        a = f.readline().strip()
                        b = t.readline().strip()
                        if a == "" or b == "": break
                        o.write("\t".join((a, b)) + "\n")
        with open(FCPaths.intersected, "r") as f:
            with open(FCPaths.forimport["intersections"], "wb") as o:
                for line in f:
                    p = line.strip()
                    o.write("\t".join((p[3], p[8])) + "\n")

def main():
    PrepImport()
    return 0

if __name__ == "__main__":
    sys.exit(main())

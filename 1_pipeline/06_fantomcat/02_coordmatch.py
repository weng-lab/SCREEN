from __future__ import print_function

import sys, os
import json

from fc_common import FCPaths

class CoordMatcher:

    @staticmethod
    def parsecoord(x):
        x = x.split("::")[1].split(":")
        y = x[1].split("..")
        return {
            "chr": x[0],
            "start": y[0],
            "stop": y[1]
        }

    @staticmethod
    def run():
        with open(FCPaths.genetsv, "r") as f:
            with open(FCPaths.genebed, "wb") as o:
                n = 0
                for line in f:
                    n += 1
                    if n % 1000 == 1 and n >= 1000: print("02_coordmatch$CoordMatcher::run: working with line %d" % n,
                                                          file = sys.stderr)
                    line = line.strip().split("\t")
                    gpath = FCPaths.genepath(line[0])
                    if not os.path.exists(gpath):
                        print("02_coordmatch$CoordMatcher::run: WARNING: JSON missing for %s; skipping" % line[0],
                              file = sys.stderr)
                        continue
                    with open(gpath, "rb") as i:
                        j = json.loads(i.read())
                    c = CoordMatcher.parsecoord(j["ZENBU_loc"])
                    o.write("%s\t%s\t%s\t%s\n" % (c["chr"], c["start"], c["stop"], line[0]))

def main():
    CoordMatcher.run()
    return 0

if __name__ == "__main__":
    sys.exit(main())

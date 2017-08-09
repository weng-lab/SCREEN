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
        with open(FCPaths.zenbu_track, "r") as f:
            with open(FCPaths.genebed, "wb") as o:
                with open(FCPaths.twokb, "wb") as u:
                    for line in f:
                        line = line.strip().split("\t")
                        gpath = FCPaths.genepath(line[0])
                        names = line[3].split("|")
                        o.write("%s\t%s\t%s\t%s\t0\t%s\n" % (line[0], line[1], line[2], names[-1], line[5]))
                        tss = 1 if line[5] == '+' else 2
                        s = int(line[tss]) - 2000
                        u.write("%s\t%d\t%d\t%s\t0\t%s\n" % (line[0], s if s > 0 else 0, int(line[tss]) + 2000, names[-1], line[5]))

def main():
    CoordMatcher.run()
    return 0

if __name__ == "__main__":
    sys.exit(main())

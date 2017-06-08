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
                for line in f:
                    line = line.strip().split("\t")
                    gpath = FCPaths.genepath(line[0])
                    names = line[3].split("|")
                    o.write("%s\t%s\t%s\t%s\n" % (line[0], line[1], line[2], names[-1]))

def main():
    CoordMatcher.run()
    return 0

if __name__ == "__main__":
    sys.exit(main())

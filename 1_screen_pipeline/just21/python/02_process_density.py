from __future__ import print_function

import os, sys
import json

class ProcessDensity:
    def __init__(self, assembly, rootpath = "/data/projects/cREs/%s/CTCF",
                 regionsize = 10000):
        self.assembly = assembly
        self.rootpath = os.path.join(rootpath % assembly, str(regionsize) + ".bed")
        self.regionsize = regionsize

    def process(self):
        cmap = {}
        with open(self.rootpath, "r") as f:
            for line in f:
                p = line.strip().split('\t')
                if p[0] not in cmap: cmap[p[0]] = []
                cmap[p[0]].append(float(p[3]))
        with open(self.rootpath + ".json", "wb") as f:
            f.write(json.dumps(cmap))
        print("wrote %s" % (self.rootpath + ".json"))

def main():
    ProcessDensity("hg19").process()
    return 0

if __name__ == "__main__":
    sys.exit(main())

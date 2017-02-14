#!/usr/bin/env python

import sys
import os
import argparse
import gzip
from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer, numLines

# from http://stackoverflow.com/a/19861595
import copy_reg
import types
def _reduce_method(meth):
    return (getattr, (meth.__self__, meth.__func__.__name__))
copy_reg.pickle(types.MethodType, _reduce_method)

class ExtractRawPeaks:
    def __init__(self, assembly, j):
        self.assembly = assembly
        self.j = j

        self.d = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9"
        self.d = os.path.join(self.d, assembly)
        self.bwtool = "/data/cherrypy/bin/bwtool"
        if not os.path.exists(self.bwtool):
            self.bwtool = "/usr/local/bin/bwtool"
        if not os.path.exists(self.bwtool):
            raise Exception("no bwtool found")
        self.masterPeakFnp = paths.path(assembly, "raw",
                                          "masterPeaks.bed.gz")
        self.numPeaks = numLines(self.masterPeakFnp)
        print(self.masterPeakFnp, "has", self.numPeaks)
        self.miniPeaksBedFnp = os.path.join(self.d, "raw",
                                            "miniPeakSites.bed.gz")
        self.bwtoolFilter = os.path.join(os.path.dirname(__file__),
                                         'minipeaks/bin/read_json')
        if not os.path.exists(self.bwtoolFilter):
            raise Exception("missing C++ bwtool filter; please compile?")

    def run(self):
        self.writeBed()
        self.extractAndDownsamplePeaks()

    def _runBwtool(self, outD, fnp):
        outFnp = os.path.join(outD, os.path.basename(fnp) + ".txt")
        if os.path.exists(outFnp):
            if os.path.getsize(outFnp) > 0:
                num = numLines(outFnp)
                if num == self.numPeaks:
                    print("skipping", outFnp, num)
                    return
        cmds = [self.bwtool, "extract", "bed",
                self.miniPeaksBedFnp,
                fnp, "/dev/stdout",
                '|', self.bwtoolFilter, "--bwtool",
                '>', outFnp]
        Utils.runCmds(cmds)

    def extractAndDownsamplePeaks(self):
        fns = ["DNase-List.txt", "H3K27ac-List.txt",
               "H3K4me3-List.txt"]

        for fn in fns:
            print("***********************", fn)
            fnp = os.path.join(self.d, "raw", fn)
            with open(fnp) as f:
                rows = [x.rstrip().split() for x in f.readlines()]

            bfnps = []
            for r in rows:
                fnp = os.path.join(d, r[0], r[1] + ".bigWig")
                if os.path.exists(fnp):
                    bfnps.append(fnp)
                else:
                    print("WARNING: missing bigwig", fnp)
            outD = os.path.join(self.d, "minipeaks")
            Utils.mkdir_p(outD)

            Parallel(n_jobs = self.j)(delayed(self._runBwtool)
                                            (outD, fnp)
                                      for fnp in bfnps)

    def writeBed(self):
        inFnp = self.masterPeakFnp
        outFnp = self.miniPeaksBedFnp

        with gzip.open(inFnp) as inF:
            with gzip.open(outFnp, "wb") as outF:
                for line in inF:
                    toks = line.rstrip().split('\t')
                    chrom = toks[0]
                    start = int(toks[1])
                    stop = int(toks[2])
                    accession = toks[4]
                    padding = (1000 - (stop - start)) / 2.0
                    outF.write('\t'.join([str(x) for x in
                                          [chrom,
                                           int(max(0, start - padding)),
                                           int(stop + padding),
                                           accession]]) + '\n')
        print("wrote", outFnp)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--list', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        ep = ExtractRawPeaks(assembly, args.j)
        ep.run()

    return 0

if __name__ == '__main__':
    sys.exit(main())

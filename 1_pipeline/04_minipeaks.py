#!/usr/bin/env python

from __future__ import print_function
import sys
import os
import argparse
import gzip
from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer, numLines, cat, printWroteNumLines, printt
from paste import chunkedPaste

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

        self.raw = paths.path(assembly, "raw")
        self.minipeaks = paths.path(assembly, "minipeaks")
        Utils.mkdir_p(self.minipeaks)

        self.bwtool = "/data/cherrypy/bin/bwtool"
        if not os.path.exists(self.bwtool):
            self.bwtool = "/usr/local/bin/bwtool"
        if not os.path.exists(self.bwtool):
            raise Exception("no bwtool found")

        self.bwtoolFilter = os.path.join(os.path.dirname(__file__),
                                         'minipeaks/bin/read_json')
        if not os.path.exists(self.bwtoolFilter):
            raise Exception("missing C++ bwtool filter; please compile?")

        self.masterPeakFnp = os.path.join(self.raw, "cREs.bed")
        self.numPeaks = numLines(self.masterPeakFnp)
        printt(self.masterPeakFnp, "has", self.numPeaks)

        self.miniPeaksBedFnp = os.path.join(self.minipeaks, "miniPeakSites.bed.gz")

        self.debug = False

    def run(self):
        self.writeBed()
        self.extractAndDownsamplePeaks()

    def _runBwtool(self, outD, fnp):
        outFnp = os.path.join(outD, os.path.basename(fnp) + ".txt")
        cmds = [self.bwtool, "extract", "bed",
                self.miniPeaksBedFnp,
                fnp, "/dev/stdout",
                '|', self.bwtoolFilter, "--bwtool",
                '>', outFnp]
        Utils.runCmds(cmds)
        if self.debug:
            printt("wrote", outFnp)

    def extractAndDownsamplePeaks(self):
        fns = ["dnase-list.txt", "h3k27ac-list.txt",
               "h3k4me3-list.txt"]

        bfnps = []
        for fn in fns:
            printt("***********************", self.assembly, fn)
            fnp = os.path.join(self.raw, fn)
            with open(fnp) as f:
                rows = [x.rstrip('\n').split() for x in f.readlines()]

            for r in rows:
                fnp = os.path.join(Dirs.encode_data, r[0], r[1] + ".bigWig")
                if os.path.exists(fnp):
                    bfnps.append(fnp)
                else:
                    printt("WARNING: missing bigwig", fnp)
        outD = os.path.join(self.minipeaks, "files")
        Utils.mkdir_p(outD)
        printt("found", len(bfnps), "files to run")

        if self.debug:
            bfnps = [bfnps[0]]
        Parallel(n_jobs = self.j)(delayed(self._runBwtool)
                                  (outD, fnp)
                                  for fnp in bfnps)

    def writeBed(self):
        inFnp = self.masterPeakFnp
        outFnp = self.miniPeaksBedFnp

        with open(inFnp) as inF:
            with gzip.open(outFnp, "wb") as outF:
                for line in inF:
                    toks = line.rstrip().split('\t')
                    chrom = toks[0]
                    start = int(toks[1])
                    stop = int(toks[2])
                    accession = toks[4]
                    padding = 1000
                    midPoint = float(stop - start) / 2.0 + start
                    outF.write('\t'.join([str(x) for x in
                                          [chrom,
                                           int(max(0, midPoint - padding)),
                                           int(midPoint + padding),
                                           accession]]) + '\n')
        printt("wrote", outFnp)

class MergeFiles:
    def __init__(self, assembly, nbins, ver, assay):
        self.assembly = assembly
        self.nbins = nbins
        self.ver = ver
        self.assay = assay

    def _getFileIDs(self, fn):
        assay = fn.split('-')[0]
        printt("***********************", self.assembly, assay)
        fnp = paths.path(self.assembly, "raw", fn)
        with open(fnp) as f:
            rows = [x.rstrip('\n').split('\t') for x in f.readlines()]
        fileIDs = sorted([r[1] for r in rows])
        return assay, fileIDs

    def run(self):
        fns = ["dnase-list.txt", "h3k27ac-list.txt", "h3k4me3-list.txt"]

        for fn in fns:
            assay, fileIDs = self._getFileIDs(fn)
            if self.assay and self.assay != assay:
                continue
            fnps = []
            presentFileIDs = []
            for fileID in fileIDs:
                fnp = paths.path(self.assembly, "minipeaks", "files",
                                 fileID + ".bigWig.txt")
                if os.path.exists(fnp):
                    fnps.append(fnp)
                    presentFileIDs.append(fileID)
                else:
                    printt("WARNING: missing", fnp)

            printt("filesIDs:", len(presentFileIDs), "for", len(fnps), "files")
            self.processRankMethod(presentFileIDs, fnps, assay)

    def _makeAccesionFile(self, fnp):
        cmds = [cat(paths.path(self.assembly, "raw", "cREs.bed")),
                '|', "awk -v OFS='\t' '{ print($5,$1) }'",
                '>', fnp]
        Utils.runCmds(cmds)
        printWroteNumLines(fnp)

    def processRankMethod(self, fileIDs, fnps, assay):
        accessionFnp = paths.path(self.assembly, "minipeaks", "merged", "accessions.txt")
        Utils.ensureDir(accessionFnp)
        if not os.path.exists(accessionFnp):
            self._makeAccesionFile(accessionFnp)

        colsFnp = paths.path(self.assembly, "minipeaks", "merged", assay + "_cols.txt")
        Utils.ensureDir(colsFnp)
        with open(colsFnp, 'w') as f:
            f.write('\t'.join(fileIDs) + '\n')
        printWroteNumLines(colsFnp)

        mergedFnp = paths.path(self.assembly, "minipeaks", "merged", assay + "_merged.txt")
        Utils.ensureDir(mergedFnp)
        printt("paste into", mergedFnp)
        chunkedPaste(mergedFnp, [accessionFnp] + fnps)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--list', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="")
    parser.add_argument('--assay', type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    assemblies = ["mm10", "hg19"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        if 1:
            ep = ExtractRawPeaks(assembly, args.j)
            ep.run()
        else:
            mf = MergeFiles(assembly, 20, 3, args.assay)
            mf.run()

    return 0

if __name__ == '__main__':
    sys.exit(main())

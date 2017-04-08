#!/usr/bin/env python

# purcaro@gmail.com
# modelled after John Stam method at
#  https://bedops.readthedocs.org/en/latest/content/usage-examples/master-list.html

from __future__ import print_function
import os, sys
import ujson as json
import argparse
import fileinput, StringIO
import gzip
import random

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from common import printr, printt
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils, numLines, printWroteNumLines
from exp import Exp

class MakeRepDHSs:
    def __init__(self, assembly):
        self.assembly = assembly
        self.d = os.path.join(paths.v4d, "just21")
        self.allExps = self._parse()
        self.hostspotFnps = []

        self.outputFolder = os.path.join(self.d, 'rDHSs')
        self.allPeaksFnp = os.path.join(self.outputFolder, 'all.bed')
        self.allMergedPeaks = os.path.join(self.outputFolder, 'merged.bed')
        self.masterPeaksFnp = os.path.join(self.outputFolder, 'masterPeaks.bed')

        self.fnToPeakNumToPeak = {}

    def _parse(self):
        fnp = os.path.join(self.d, "list.txt")
        with open(fnp) as f:
            header = f.readline().rstrip('\n').split('\t')
            ctToExpIDsRows = [line.rstrip('\n').split('\t') for line in  f if line]
        allExps = {}
        for ctToExpIDs in ctToExpIDsRows:
            ct = ctToExpIDs[0]
            allExps[ct] = {}
            for idx, expID in enumerate(ctToExpIDs[1:]):
                allExps[ct][header[idx + 1]] = Exp.fromJsonFile(expID) #, True)
        if 0:
            for ct, exps in allExps.iteritems():
                print(ct, exps["DNase"], exps["H3K4me3"], exps["H3K27ac"], exps["CTCF"])
        return allExps

    def _getInputFnps(self):
        for ct, exps in self.allExps.iteritems():
            for assay in ["DNase"]:
                exp = exps[assay]
                f = exp.getDccUniformProcessedHotspots("hg19")
                if not f:
                    #f = exp.bigWigFilters("hg19")
                    #if len(f) != 1:
                    print("missing", ct, assay, exp.encodeID)
                    continue
                    # raise Exception("could not find", ct, assay, exp.encodeID)
                f[0].download()
                self.hostspotFnps.append((f[0].fnp(), f[0].fileID))

    def run(self):
        self._getInputFnps()

        Utils.mkdir_p(self.outputFolder)

        self.mergeAndLabelAllPeaks()

        self.loadBedData()

        with open(self.allMergedPeaks) as inF:
            with open(self.masterPeaksFnp, 'w') as outF:
                self.findMasterPeaks(inF, outF)
        Utils.sortFile(self.masterPeaksFnp)

        print("round 0: wrote", self.masterPeaksFnp)
        print("round 0: num master peaks:", numLines(self.masterPeaksFnp))

        self.addExtraMasterPeaks()

        print("done")

    def loadBedData(self):
        for fnp, fileID in self.hostspotFnps:
            print(fnp)

            peakNumToPeak = {}
            lines = [r for r in fileinput.input(fnp, mode="r",
                                                openhook=fileinput.hook_compressed)]
            for idx, line in enumerate(lines):
                peakNumToPeak[idx] = line.strip().split('\t')
            self.fnToPeakNumToPeak[fileID] = peakNumToPeak

    def getPvalue(self, peak):
        line = self.fnToPeakNumToPeak[peak[1]][peak[2]]
        return float(line[-1])

    def findMasterPeaks(self, inF, outF):
        for line in inF:
            # example: [['14.781250', 'ENCFF418CIM.bed', '1'], ['16.609375', 'ENCFF137YGV.bed', '1']...
            peaks = line.strip().split("\t")[3].split(',')
            peaks = [x.split('-') for x in peaks]
            for peak in peaks:
                peak[0] = float(peak[0]) # signal
                peak[2] = int(peak[2]) # line number

            maxPeak = peaks[0]
            for peak in peaks[1:]:
                if peak[0] == maxPeak[0]:
                    if self.getPvalue(peak) > self.getPvalue(maxPeak):
                        maxPeak = peak
                else:
                    if peak[0] > maxPeak[0]:
                        maxPeak = peak

            line = self.fnToPeakNumToPeak[maxPeak[1]][maxPeak[2]] # fileName x line number
            outF.write('\t'.join([line[0], line[1], line[2], maxPeak[1], str(maxPeak[0])]) + "\n")

    def addExtraMasterPeaks(self):
        for roundNum in xrange(1, 20):
            intersectingPeaksFnp = os.path.join(self.outputFolder,
                                                "round_" + str(roundNum) + ".intersect.bed")
            cmds = ["bedtools", "intersect", "-a", self.allPeaksFnp, "-b", self.masterPeaksFnp, "-v",
                    '|', 'sort -k1,1 -k2,2n', '>', intersectingPeaksFnp]
            Utils.runCmds(cmds)
            if 0 == numLines(intersectingPeaksFnp):
                print("no more extraneous peaks found; exiting")
                return

            mergedPeaksFnp = os.path.join(self.outputFolder,
                                          "round_" + str(roundNum) + ".merge.bed")
            cmds = ['cat', intersectingPeaksFnp,
                    '|', "bedtools merge -i stdin -c 4 -o collapse", '>', mergedPeaksFnp]
            Utils.runCmds(cmds)

            print("round", roundNum, "number of non-intersecting peaks",
                  "{:,}".format(numLines(mergedPeaksFnp)))
            with open(mergedPeaksFnp) as inF:
                with open(self.masterPeaksFnp, 'a') as outF:
                    self.findMasterPeaks(inF, outF)
            Utils.sortFile(self.masterPeaksFnp)
            print("\tround", roundNum, "num master peaks:", numLines(self.masterPeaksFnp))
        print("exceeded 20 rounds of adding peaks!")

    def mergeAndLabelAllPeaks(self):
        print("combining all peaks into one file; peaks will also be labelled with filename...")

        with open(self.allPeaksFnp, 'w') as outF:
            for fnp, fileID in self.hostspotFnps:
                print(fnp)
                lines = [r for r in fileinput.input(fnp, mode="r",
                                                    openhook=fileinput.hook_compressed)]
                for idx, line in enumerate(lines):
                    toks = line.rstrip('\n').split('\t')
                    outF.write('\t'.join([toks[0], toks[1], toks[2],
                                          toks[4] + '-' + fileID + '-' + str(idx)]) + '\n')
        printWroteNumLines(self.allPeaksFnp)
        Utils.sortFile(self.allPeaksFnp)

        print("merging....")
        cmds = ["cat", self.allPeaksFnp,
                '|', "bedtools merge -i stdin -c 4 -o collapse",
                '>', self.allMergedPeaks]
        Utils.runCmds(cmds)
        printWroteNumLines(self.allMergedPeaks)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--assembly', type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    assemblies = ["hg19"] #Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        print("**********", assembly)
        j = MakeRepDHSs(assembly)
        j.run()

    return 0

if __name__ == '__main__':
    sys.exit(main())

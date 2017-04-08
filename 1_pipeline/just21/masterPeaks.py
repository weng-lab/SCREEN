#!/usr/bin/env python

# purcaro@gmail.com
# modelled after John Stam method at
#  https://bedops.readthedocs.org/en/latest/content/usage-examples/master-list.html

import os, sys, subprocess

baseFolder = os.path.expanduser("~/masterMousePeaks.Nov2015")
bedPeaksFolder = os.path.join(baseFolder, 'input', 'encodeNarrowPeak');

outputFolder = os.path.join(baseFolder, 'output')
allPeaksFnp = os.path.join(outputFolder, 'all.bed')
allMergedPeaks = os.path.join(outputFolder, 'merged.bed')
masterPeaksFnp = os.path.join(outputFolder, 'masterPeaks.bed')

fnToPeakNumToPeak = {}

class Utils:
    @staticmethod
    def runCmds(cmds, verbose = False):
        cmd = " ".join(cmds)
        if verbose:
            print("running: ", cmd)

        ret = []

        # from http://stackoverflow.com/a/4418193
        process = subprocess.Popen(cmd, shell=True, stdout=subprocess.PIPE,
                                    stderr=subprocess.STDOUT, executable='/bin/bash')
        # Poll process for new output until finished
        while True:
            nextline = process.stdout.readline()
            if nextline == '' and process.poll() != None:
                break
            #sys.stdout.write(nextline)
            #sys.stdout.flush()
            ret.append(nextline)

        output = process.communicate()[0]
        exitCode = process.returncode

        if (exitCode == 0):
            return "".join(ret)
        raise Exception(cmd, exitCode, output)

def loadBedData():
    for fn in os.listdir(bedPeaksFolder):
        if not fn.endswith(".bed"):
            continue

        peakNumToPeak = {}
        with open(os.path.join(bedPeaksFolder, fn)) as f:
            for idx, line in enumerate(f):
                # 1-based indexing for AWK compatibility
                # example: ['chr1', '3094960', '3095110', '.', '0', '.', '6.187500', '3.92128', '-1', '-1']
                peakNumToPeak[idx+1] = line.strip().split('\t')
            fnToPeakNumToPeak[os.path.basename(fn)] = peakNumToPeak

def getPvalue(peak):
    line = fnToPeakNumToPeak[peak[1]][peak[2]]
    return float(line[7])

def findMasterPeaks(inF, outF):
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
                if getPvalue(peak) > getPvalue(maxPeak):
                    maxPeak = peak
            else:
                if peak[0] > maxPeak[0]:
                    maxPeak = peak

        line = fnToPeakNumToPeak[maxPeak[1]][maxPeak[2]] # fileName x line number
        outF.write('\t'.join([line[0], line[1], line[2], maxPeak[1], str(maxPeak[0])]) + "\n")

def numLines(fnp):
    cmds = ["cat", fnp, "| wc -l"]
    return int(Utils.runCmds(cmds))

def sortFile(fnp):
    cmds = ["sort", "-o", fnp, "-k1,1 -k2,2n", fnp]
    Utils.runCmds(cmds)

def addExtraMasterPeaks():
    for roundNum in xrange(1, 20):
        intersectingPeaksFnp = os.path.join(outputFolder, "round_" + str(roundNum) + ".intersect.bed")
        cmds = ["bedtools", "intersect", "-a", allPeaksFnp, "-b", masterPeaksFnp, "-v",
                '|', 'sort -k1,1 -k2,2n', '>', intersectingPeaksFnp]
        Utils.runCmds(cmds)
        if 0 == numLines(intersectingPeaksFnp):
            print "no more extraneous peaks found; exiting"
            return

        mergedPeaksFnp = os.path.join(outputFolder, "round_" + str(roundNum) + ".merge.bed")
        cmds = ['cat', intersectingPeaksFnp,
                '|', "bedtools merge -i stdin -c 4 -o collapse", '>', mergedPeaksFnp]
        Utils.runCmds(cmds)

        print "round", roundNum, "number of non-intersecting peaks", numLines(mergedPeaksFnp)
        with open(mergedPeaksFnp) as inF:
            with open(masterPeaksFnp, 'a') as outF:
                findMasterPeaks(inF, outF)
        sortFile(masterPeaksFnp)
        print "\tround", roundNum, "num master peaks:", numLines(masterPeaksFnp)
    print "exceeded 20 rounds of adding peaks!"

def mergeAndLabelAllPeaks():
    print "combining all peaks into one file; peaks will also be labelled with filename..."
    cmds = ["cd", bedPeaksFolder, "&&",
            """ awk -v OFS='\t' '{ print $1,$2,$3,$7"-"FILENAME"-"FNR }' *.bed""",
            '|', 'sort -k1,1 -k2,2n',
            '>', allPeaksFnp]
    Utils.runCmds(cmds)

    print "merging...."
    cmds = ["cat", allPeaksFnp,
            '|', "bedtools merge -i stdin -c 4 -o collapse",
            '>', allMergedPeaks]
    Utils.runCmds(cmds)

def main():
    if not os.path.exists(bedPeaksFolder):
        print "please set folder for input bed files"
        print "folder is currently", bedPeaksFolder
        sys.exit(1)
    if not os.path.exists(outputFolder):
        os.makedirs(outputFolder)

    mergeAndLabelAllPeaks()

    loadBedData()

    with open(allMergedPeaks) as inF:
        with open(masterPeaksFnp, 'w') as outF:
            findMasterPeaks(inF, outF)

    sortFile(masterPeaksFnp)

    print "round 0: wrote", masterPeaksFnp
    print "round 0: num master peaks:", numLines(masterPeaksFnp)

    addExtraMasterPeaks()

    print "done"

if __name__ == "__main__":
    sys.exit(main())

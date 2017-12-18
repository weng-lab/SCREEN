#!/usr/bin/env python2

from __future__ import print_function

import sys
import os
import re
from collections import OrderedDict, defaultdict

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from exp import Exp
from utils import eprint
from metadataws import MetadataWS

AssayColors = {"DNase": ["6,218,147", "#06DA93"],
               "RNA-seq": ["0,170,0", "", "#00aa00"],
               "RAMPAGE": ["214,66,202", "#D642CA"],
               "H3K4me1": ["255,223,0", "#FFDF00"],
               "H3K4me2": ["255,255,128", "#FFFF80"],
               "H3K4me3": ["255,0,0", "#FF0000"],
               "H3K9ac": ["255,121,3", "#FF7903"],
               "H3K27ac": ["255,205,0", "#FFCD00"],
               "H3K27me3": ["174,175,174", "#AEAFAE"],
               "H3K36me3": ["0,128,0", "#008000"],
               "H3K9me3": ["180,221,228", "#B4DDE4"],
               "Conservation": ["153,153,153", "#999999"],
               "TF ChIP-seq": ["18,98,235", "#1262EB"],
               "CTCF": ["0,176,240", "#00B0F0"]}

SubGroupKeys = ["age", "donor", "label", "assay", "view"]

def viz(state, active):
    if active:
        return state
    return "hide"

def sanitize(s, replChar='_'):
    return re.sub('[^0-9a-zA-Z]+', replChar, s)

def unrollEquals(sUnsorted):
    r = ''
    s = OrderedDict(sorted(sUnsorted.items()))
    for k, v in s.iteritems():
        r += k + '=' + v + ' '
    return r

def getOrUnknown(s):
    if not s:
        return "unknown"
    return s

def makeTrackName(n):
    n = n.replace(" ", "_").replace('(','').replace(')','')
    n = n[:100]
    return n

def makeLongLabel(n):
    return n[:80]

def makeShortLabel(*n):
    return ' '.join([x for x in n if x])[:17]

def bigWigFilters(assembly, exp):
    def fileFilters():
        for ot in ["fold change over control",
                   "signal of unique reads",
                   "signal of all reads",
                   "raw signal",
                   "wavelet-smoothed signal",
                   "percentage normalized signal",
                   "read-depth normalized signal"
                   ]:
            yield lambda x: x.output_type == ot and x.isPooled
            for rep in xrange(0, 5):
                yield lambda x: x.output_type == ot and rep in x.bio_rep and len(x.tech_rep) > 1
                yield lambda x: x.output_type == ot and rep in x.bio_rep and (str(rep) + '_' + str(rep)) in x.tech_rep
                yield lambda x: x.output_type == ot and rep in x.bio_rep
            yield lambda x: x.output_type == ot and [] == x.bio_rep
            yield lambda x: x.output_type == ot and {} == x.bio_rep

    def rnaFilters():
        for ot in ["plus strand signal of unique reads",
                   "minus strand signal of unique reads",
                   "plus strand signal of all reads",
                   "minus strand signal of all reads",
                   "plus strand signal",
                   "minus strand signal",
                   "signal of unique reads",
                   "signal of all reads",
                   ]:
            yield lambda x: x.output_type == ot and x.isPooled and x.genome_annotation
            for rep in xrange(0, 5):
                yield lambda x: x.output_type == ot and rep in x.bio_rep and x.genome_annotation
            yield lambda x: x.output_type == ot and [] == x.bio_rep and x.genome_annotation
            yield lambda x: x.output_type == ot and {} == x.bio_rep and x.genome_annotation

            yield lambda x: x.output_type == ot and x.isPooled
            for rep in xrange(0, 5):
                yield lambda x: x.output_type == ot and rep in x.bio_rep
            yield lambda x: x.output_type == ot and [] == x.bio_rep
            yield lambda x: x.output_type == ot and {} == x.bio_rep

    def otherFilters():
        return [lambda bw: bw.isRawSignal() and bw.bio_rep == 1,
                lambda bw: bw.isRawSignal() and bw.bio_rep == 2,
                lambda bw: bw.isSignal() and bw.bio_rep == 1,
                lambda bw: bw.isSignal() and bw.bio_rep == 2,
                lambda bw: bw.isSignal()
        ]

    files = sorted(filter(lambda x: x.isBigWig() and x.assembly == assembly and x.isReleased(),
                          exp.files), key=lambda f: f.fileID, reverse=True)

    if exp.isRnaSeqLike():
        for bf in rnaFilters():
            bigWigs = filter(bf, files)
            if 1 == len(bigWigs):
                return bigWigs
            if len(bigWigs) > 1:
                trybw = filter(lambda x: 'tophat' not in x.submitted_file_name, bigWigs)
                if 1 == len(trybw):
                    # was an RNA-seq experiment w/ both STAR and TOPHAT files...
                    return trybw
                return [sorted(bigWigs, key=lambda x: x.fileID)[0]] # just choose one...
    else:
        for bf in fileFilters():
            bigWigs = filter(bf, files)
            if bigWigs:
                if len(bigWigs) > 1:
                    for bw in bigWigs:
                        print(bw.expID, bw)
                return sorted(bigWigs, key=lambda x: x.fileID)

    for bf in otherFilters():
        bigWigs = filter(bf, files)
        if bigWigs:
            return [bigWigs[0]] # TODO: fixme!

    eprint("error: no files found after filtering...")
    for f in files:
        eprint(exp)
        eprint(f)

    return []

def bigBedFilters(assembly, exp):
    files = sorted(filter(lambda x: x.isBigBed() and x.assembly == assembly and x.isReleased(),
                          exp.files), key=lambda f: f.fileID, reverse=True)

    if exp.isRnaSeqLike():
        return []

    def fileFilters():
        yield lambda x: x.isReplicatedPeaks()
        yield lambda x: x.isBigBedNarrowPeak() and x.isIDRoptimal()
        yield lambda x: x.isBigBedNarrowPeak() and x.isIDR()
        yield lambda x: x.isBigBedNarrowPeak() and x.isReplicatedPeaks()
        for rep in xrange(0, 5):
            yield lambda x: x.isBigBedNarrowPeak() and rep in x.bio_rep
        yield lambda x: x.isBigBedNarrowPeak()
        yield lambda x: x.isBigBedBroadPeak()
        yield lambda x: x.isPeaks()

    for bf in fileFilters():
        beds = filter(bf, files)
        beds = filter(lambda x: x.assembly == assembly, beds)
        if beds:
            return beds
    return []

html_escape_table = {
    "&": "&amp;",
    '"': "&quot;",
    "'": "&apos;",
    ">": "&gt;",
    "<": "&lt;",
    ".": "&#46;",
    ' ': "&#32;"
}

def html_escape(text):
    """Produce entities within text."""
    return "".join(html_escape_table.get(c,c) for c in text)

def colorize(exp):
    c = "227,184,136"
    if exp.tf in AssayColors:
        c = AssayColors[exp.tf][0]
    if not c:
        if exp.isChipSeqTF():
            if "CTCF" == exp.tf:
                c = AssayColors["CTCF"][0]
            else:
                c = AssayColors["TF ChIP-seq"][0]
    return c

def main():
    expID = 'ENCSR000BCA' #ENCSR000SKS' #ENCSR000BCE' #'ENCSR000AEC'
    if 1:
        mw = MetadataWS(host="http://192.168.1.46:9008/metadata")
        exp = mw.exps([expID])[0]
    else:
        exp = Exp.fromJsonFile(expID)
    files = bigWigFilters("hg19", exp)
    print("found", len(files))
    for f in files:
        print(f, f.bio_rep)

if __name__ == '__main__':
    main()

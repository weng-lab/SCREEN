
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng

from __future__ import print_function

import sys
import os
import gzip

sys.path.append("../../../../metadata/utils")
from exp import Exp


class TADConverter:

    def __init__(self, path):
        self.tads = {}
        self.exps = {}
        with gzip.open(path, "r") as f:
            for line in f:
                p = line.strip().split('\t')
                acc = p[3].split("-")[0]
                if acc not in self.exps:
                    self.exps[acc] = Exp.fromJsonFile(acc).biosample_term_name
                    self.tads[acc] = {}
                if p[0] not in self.tads[acc]:
                    self.tads[acc][p[0]] = []
                self.tads[acc][p[0]].append([int(p[1]), int(p[2])])

    def write_biosamples(self, path):
        with open(path, "wb") as o:
            for acc, name in self.exps.iteritems():
                o.write("%s\t%s\n" % (acc, name))

    def write_tads(self, basename):
        for acc, tads in self.tads.iteritems():
            with open("%s.%s.tsv" % (basename, acc), "wb") as o:
                for chrom, tadlist in tads.iteritems():
                    for tad in tadlist:
                        o.write("%s\t%d\t%d\n" % (chrom, tad[0], tad[1]))

    def write_all_tads(self, path):
        with open(path, "wb") as o:
            for acc, tads in self.tads.iteritems():
                for chrom, tadlist in tads.iteritems():
                    for tad in tadlist:
                        o.write("%s\t%s\t%s\t%d\n" % (acc, chrom, tad[0], tad[1]))


def main():
    t = TADConverter("/data/projects/screen/Version-4/ver10/hg19/extras/TADs.bed.gz")
    t.write_biosamples("/data/projects/cREs/hg19/CTCF/tad_biosamples.tsv")
    t.write_all_tads("/data/projects/cREs/hg19/CTCF/all_tads.tsv")
    t.write_tads("/data/projects/cREs/hg19/CTCF/tads")
    return 0


if __name__ == "__main__":
    sys.exit(main())

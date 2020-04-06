
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng

from __future__ import print_function

import sys
import os
import glob

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../../../metadata/utils"))
from exp import Exp
from exp_file import ExpFile


class CreateHg38:
    LISTFILES = ["dnase-list.txt", "h3k4me3-list.txt", "h3k27ac-list.txt", "ctcf-list.txt"]

    @staticmethod
    def _process(exp, tassembly="GRCh38"):
        allsignal = glob.glob("/data/projects/encode/data/%s/*.bigWig" % exp.encodeID)
        signal = {}
        for signalfile in allsignal:
            f = ExpFile.fromJsonFile(exp.encodeID, os.path.basename(signalfile).split(".")[0], True)
            if f.assembly == tassembly:
                signal[f.biological_replicates[0]] = f
        peaks = {x.biological_replicates[0]: x for x in filter(lambda x: x.assembly == tassembly and x.file_type == "bed broadPeak", exp.files)}
        return (peaks, signal)

    @staticmethod
    def _writehotspots(filemap, path):
        with open(path, "wb") as o:
            for k, v in filemap.iteritems():
                ct, acc = k
                for peaks, signal in v:
                    o.write("%s\t%s\t%s\t%s\t%s\n" % (acc, peaks, acc, signal, ct))

    @staticmethod
    def _writelist(filemap, path):
        with open(path, "wb") as o:
            for k, v in filemap.iteritems():
                ct, acc = k
                peaks, signal = v
                o.write("%s\t%s\t%s\n" % (acc, signal, ct))

    def __init__(self, rootdir):
        self.filemap = {}
        for k in CreateHg38.LISTFILES:
            self.filemap[k] = {}
            self.filemap[k + "_all"] = {}

        # for each assay
        for listfile in CreateHg38.LISTFILES:

            # load each exp accession from the existing list
            # for each, append only the first rep to one list and all reps to the other
            with open(os.path.join(rootdir, listfile), "r") as f:
                for line in f:
                    p = line.strip().split('\t')
                    try:
                        e = Exp.fromJsonFile(p[0])
                        peaks, signal = CreateHg38._process(e)
                        k = p[4] if len(p) >= 5 else p[2]
                        self.filemap[listfile][(k, e.encodeID)] = (peaks[1].fileID, signal[1].fileID)
                        self.filemap[listfile + "_all"][(k, e.encodeID)] = [(peaks[x].fileID, signal[x].fileID) for x, _ in signal.iteritems()]
                    except:
                        print("00_create_hg38$CreateHg38::__init__: could not process %s; skipping" % p[0])

            # if DNase, write all reps to Hotspot-List.txt
            if listfile == "dnase-list.txt":
                CreateHg38._writehotspots(self.filemap[listfile + "_all"], "/data/projects/cREs/hg38/Hotspot-List.txt")
                print("wrote /data/projects/cREs/hg38/Hotspot-List.txt")

            # write first reps to list file
            CreateHg38._writelist(self.filemap[listfile], "/data/projects/cREs/hg38/%s" % listfile)
            print("wrote /data/projects/cREs/hg38/%s" % listfile)


def main():
    CreateHg38("/data/projects/screen/Version-4/ver10/hg19/raw")
    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from exp import Exp
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, eprint, AddPath

AddPath(__file__, '../../common/')
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths

from collections import namedtuple
CRE = namedtuple('CRE', ["chrom", "start", "stop", "mpName", "accession"])

class CheckCellTypes:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self._load()

    def _load(self):
        fnBases = [("CTCF", 2),
                   ("DNase", 2),
                   ("Enhancer", 4),
                   ("H3K27ac", 2),
                   ("H3K4me3", 2),
                   ("Insulator", 4),
                   ("Promoter", 4)]
        self.rankMethodToCtAndFileID = []
        for fnBase, ctIdx in fnBases:
            fn = fnBase + "-List.txt"
            fnp = paths.path(self.assembly, "raw", fn)
            if not os.path.exists(fnp):
                raise Exception("missing " + fnp)
            with open(fnp) as f:
                rows = [x.rstrip('\n').split('\t') for x in f]
            for r in rows:
                efn = r[:ctIdx]
                if 2 == len(efn):
                    efn = '-'.join(efn) + ".txt"
                else:
                    efn = '.'.join(['-'.join(efn[:2]),
                                    '-'.join(efn[2:4])]) + ".txt"
                fnp = paths.path(self.assembly, "raw", "signal-output", efn)
                if 0:
                    if not os.path.exists(fnp):
                        raise Exception("missing", fnp)
                d = [fnBase, r[ctIdx], fnp]
                self.rankMethodToCtAndFileID.append(d)

    def run(self):
        fnp = paths.path(self.assembly, "raw", "masterPeaks.bed.gz")
        cmds = ["zcat", fnp,
                '|',
                """awk 'BEGIN {srand()} !/^$/ { if(rand() <= .00001) print $0}'"""]
        cres = [x.rstrip('\n').split('\t') for x in Utils.runCmds(cmds) if x]
        cres = filter(lambda x: x[0] in chroms[self.assembly], cres)
        print("selected", len(cres), "cres")
        cres = [CRE(*x) for x in cres]
        for cre in cres:
            print(cre)


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = ["mm10", "hg19"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        with getcursor(DBCONN, "check") as curs:
            print('***********', assembly)
            ctt = CheckCellTypes(curs, assembly)
            ctt.run()

    return 0

if __name__ == '__main__':
    main()

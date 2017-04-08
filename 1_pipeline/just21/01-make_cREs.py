#!/usr/bin/env python

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
from utils import Utils
from exp import Exp

class Just21:
    def __init__(self, assembly):
        self.assembly = assembly
        self.d = os.path.join(paths.v4d, "just21")
        self.exps = self._parse()

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
                allExps[ct][header[idx + 1]] = Exp.fromJsonFile(expID)
        if 0:
            for ct, exps in allExps.iteritems():
                print(ct, exps["DNase"], exps["H3K4me3"], exps["H3K27ac"], exps["CTCF"])
        return allExps    
        
    def run(self):
        for ct, exps in allExps.iteritems():
            for assay in ["DNase", "H3K4me3", "H3K27ac", "CTCF"]:
                exp = exps[assay]
                f = exp.getDccUniformProcessedBigWig("hg19")
                f.download()

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
        j = Just21(assembly)
        j.run()

    return 0

if __name__ == '__main__':
    sys.exit(main())

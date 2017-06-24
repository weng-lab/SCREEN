#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from exp import Exp
from utils import Utils, printt, printWroteNumLines, cat
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs

class BuildGwas:
    def __init__(self, assembly):
        self.assembly = assembly

    def processGwasBed(self, origBedFnp, bedFnp):
        printt("reading", origBedFnp)
        with open(origBedFnp) as f:
            rows = [r.rstrip().split('\t') for r in f if r]
        printt("split rows")
        split = []
        for r in rows:
            if ',' not in r[4]:
                split.append(r)
                continue
            taggedSNPs = r[4].split(',')
            r2s = r[5].split(',')
            a = list(r)
            b = list(r)
            a[4] = taggedSNPs[0]
            b[4] = taggedSNPs[1]
            a[5] = r2s[0]
            b[5] = r2s[1]
            split.append(a)
            split.append(b)
        printt("split rows", len(rows), "to", len(split))

        printt("adding authorPubmedTrait")
        for r in split:
            authorPubmedTrait = r[-1]
            r[-1] = authorPubmedTrait.replace('-', '_')

        print("***********", split[0][-1])

        printt("writing", bedFnp)
        with open(bedFnp, 'w') as f:
            for r in split:
                f.write('\t'.join(r) + '\n')
        Utils.sortFile(bedFnp)
        printWroteNumLines(bedFnp)

    def run(self):
        dataF = paths.path(self.assembly, "gwas", "h3k27ac")

        origBedFnp = os.path.join(dataF, "GWAS.v3.bed")
        bedFnp = os.path.join(dataF, "GWAS.v3.sorted.bed")
        self.processGwasBed(origBedFnp, bedFnp)

def run(args, DBCONN):
    assemblies = ["hg19"] #Config.assemblies

    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        if "hg19" != assembly:
            print("skipping...")
            continue
        printt('***********', assembly)
        ig = BuildGwas(assembly)
        ig.run()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    run(args, None)
        
if __name__ == '__main__':
    main()

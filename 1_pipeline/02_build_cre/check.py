#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from utils import Utils, eprint, AddPath

AddPath(__file__, '../../common/')
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths
from postgres_wrapper import PostgresWrapper
from cre_utils import isclose

AddPath(__file__, '../../website/common/')
from pg import PGsearch
from cached_objects import CachedObjects

AddPath(__file__, '../../website/models/')
from cre import CRE

from collections import namedtuple
CREnt = namedtuple('CREnt', ["chrom", "start", "stop", "mpName", "accession"])

class CheckCellTypes:
    def __init__(self, DBCONN, assembly):
        self.assembly = assembly
        self.ps = PostgresWrapper(DBCONN)
        self.pgSearch = PGsearch(self.ps, self.assembly)
        self.cache = CachedObjects(self.ps, self.assembly)
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
        cres = [CREnt(*x) for x in cres]

        lookups = {"DNase" : "dnase",
                   "H3K4me3" : "h3k4me3-only",
                   "Promoter" : "dnase+h3k4me3",
                   "H3K27ac" : "h3k27ac-only",
                   "Enhancer" : "dnase+h3k27ac",
                   "CTCF" : "ctcf-only",
                   "Insulator" : "dnase+ctcf"}
        for cre in cres:
            allRanks = CRE(self.pgSearch, cre.accession, self.cache).allRanks()
            for rm, ct, fnp in self.rankMethodToCtAndFileID:
                cmds = ['grep', cre.mpName, fnp]
                zscore = Utils.runCmds(cmds)[0].split('\t')[1]
                zscoreDb = allRanks[lookups[rm]]["zscores"][ct]
                if not isclose(zscore, zscoreDb):
                    eprint("PROBLEM")
                    eprint(cre)
                    eprint(rm, ct)
                    eprint("from", fnp)
                    eprint(zscore)
                    eprint("from DB lookup")
                    eprint(zscoreDb)
                    #eprint(allRanks)


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
        print('***********', assembly)
        ctt = CheckCellTypes(DBCONN, assembly)
        ctt.run()

    return 0

if __name__ == '__main__':
    main()

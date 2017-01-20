#!/usr/bin/env python

import sys, os
import argparse

import psycopg2, psycopg2.pool
import subprocess
import glob

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from exp import Exp
from db_utils import getcursor

class GetBigWigInfos:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.chroms = chroms[self.assembly]

    def run(self):
        self.getExpAndFileAccessions()
        self.getMaxes()
        print(self.maxes)

        outFnp = paths.bigwigmaxes(self.assembly)
        with open(outFnp, "wb") as o:
            for bigwig, _max in self.maxes.iteritems():
                o.write("%s\t%d\n" % (bigwig, _max))
        print("wrote", outFnp)

    def getExpAndFileAccessions(self):
        self.curs.execute("""
    select expid, fileid from {tn} where assay = 'DNase'
    """.format(tn = self.assembly + "_datasets"))
        self.exps = [{"accession" : r[0], "bigwig" : r[1]}
                     for r in self.curs.fetchall()]

    def getMaxes(self):
        # for each BigWig, get maximum
        self.maxes = {}
        for v in self.exps:
            for fnp in glob.glob(os.path.join("/project/umw_zhiping_weng/0_metadata/encode/data/%s/*.bigWig" % (v["accession"]))):
    #        targetfile = os.path.join("/project/umw_zhiping_weng/0_metadata/encode/data/%s/%s.bigWig" % (v["accession"], v["bigwig"]))
                print(fnp)
                if not os.path.exists(fnp):
                    print("WARNING: file %s does not exist; skipping" % fnp)
                    continue
                self.maxes[v["bigwig"]] = self.get_maxsignal(fnp, v)
                if self.maxes[v["bigwig"]] == 0:
                    print("WARNING: max signal of 0 for %s" % fnp)

    def get_maxsignal(self, targetfile, v):
        signals = []
        for chrom in self.chroms:
            try:
                r = subprocess.check_output(
                    ["/project/umw_zhiping_weng/0_metadata/tools/ucsc.v287/bigWigSummary",
                     targetfile, chrom, "0", "250000000", "1", "-type=max"])
                signals.append(int(r))
            except:
                print("WARNING: failed to get data for %s:%s; skipping" % (targetfile, chrom))
        return max(signals) if len(signals) > 0 else 0

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="hg19")
    parser.add_argument('--version', type=int, default=7)
    return parser.parse_args()

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for assembly in ["mm10", "hg19"]:
        with getcursor(DBCONN, "16_bigwig") as curs:
            gbw = GetBigWigInfos(curs, assembly)
            gbw.run()

if __name__ == '__main__':
    sys.exit(main())

#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip
from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect, db_connect_single
from constants import chroms, paths, DB_COLS

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils'))
from db_utils import getcursor, makeIndex, makeIndexArr, makeIndexIntRange, makeIndexInt4Range, vacumnAnalyze
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer

# from http://stackoverflow.com/a/19861595
import copy_reg
import types
def _reduce_method(meth):
    return (getattr, (meth.__self__, meth.__func__.__name__))
copy_reg.pickle(types.MethodType, _reduce_method)

class CreateIndices:
    def __init__(self, j, info):
        self.j = 32
        self.chroms = info["chrs"]
        self.baseTableName = info["tableName"]
        self.d = info["d"]
        self.all_cols = DB_COLS
        self.zscore_cols = [x for x in self.all_cols if x.endswith("_zscore")]

    def run(self):
        Parallel(n_jobs = self.j)(delayed(self._run_chr)
                                  (chrom)
                                  for chrom in self.chroms)

    def vac(self):
        with db_connect_single(os.path.realpath(__file__)) as conn:
            vacumnAnalyze(conn, self.baseTableName, self.chroms)
            
    def _run_chr(self, chrom):
        ctn = self.baseTableName + '_' + chrom

        with db_connect_single(os.path.realpath(__file__)) as conn:
            with conn.cursor() as curs:
                makeIndex(curs, ctn, ["accession"])
                makeIndexInt4Range(curs, ctn, ["start", "stop"])
                makeIndexRev(curs, ctn, ["maxz", "enhancerMaxz",
                                         "promoterMaxz"])
                conn.commit()
                for col in self.zscore_cols:
                    makeIndexArr(curs, ctn, col, conn)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=1)
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def makeInfo(assembly):
    return {"chrs" : chroms[assembly],
            "assembly" : assembly,
            "d" : paths.fnpCreTsvs(assembly),
            "base" : paths.path(assembly),
            "tableName" : assembly + "_cre"}

infos = {"mm10" : makeInfo("mm10"),
         "hg19" : makeInfo("hg19")}

def main():
    args = parse_args()

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        m = infos[assembly]

        ci = CreateIndices(args.j, m)
        #ci.run()
        ci.vac()

    return 0

if __name__ == '__main__':
    main()

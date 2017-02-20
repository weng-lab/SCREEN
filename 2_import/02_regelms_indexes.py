#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, paths, DB_COLS

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils'))
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer

class CreateIndices:
    def __init__(self, DBCONN, info):
        self.DBCONN = DBCONN
        self.chrs = info["chrs"]
        self.baseTableName = info["tableName"]
        self.d = info["d"]
        self.all_cols = DB_COLS
        self.zscore_cols = [x for x in self.all_cols if x.endswith("_zscore")]

    def run(self):
        self.setupRangeFunction()
        for chrom in self.chrs:
            ctn = self.baseTableName + '_' + chrom
            with getcursor(self.DBCONN, "index " + ctn) as curs:
                makeIndex(curs, ctn, ["accession"])
                makeIndexIntRange(curs, ctn, ["start", "stop"])
                makeIndexRev(curs, ctn, ["maxz", "enhancerMaxz",
                                         "promoterMaxz"])
                if 0:
                    for col in self.zscore_cols:
                        makeIndexArr(curs, ctn, col)

    def setupRangeFunction(self):
        print("create range function...")
        with getcursor(self.DBCONN, "08_setup_log") as curs:
            curs.execute("""
create or replace function intarray2int4range(arr int[]) returns int4range as $$
    select int4range(min(val), max(val) + 1) from unnest(arr) as val;
$$ language sql immutable;

create or replace function numarray2numrange(arr numeric[]) returns numrange as $$
    select numrange(min(val), max(val) + 1) from unnest(arr) as val;
$$ language sql immutable;
        """)

def parse_args():
    parser = argparse.ArgumentParser()
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

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        m = infos[assembly]

        ci = CreateIndices(DBCONN, m)
        ci.run()

    return 0

if __name__ == '__main__':
    main()

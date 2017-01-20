#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor
from files_and_paths import Dirs

def setupLiftover(curs, tableName):
    print("dropping and creating", tableName)
    curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}(
id serial PRIMARY KEY,
chrom text,
start integer,
stop integer,
mouseAccession text,
humanAccession text,
overlap integer
);
""".format(tableName = tableName))
    printt("\tok")

def getMpToAccLookup(curs, assembly):
    print("making lookup", assembly)
    curs.execute("""
    SELECT mpName, accession from {tn}
""".format(tn = assembly + "_cre"))
    ret = {r[0] : r[1] for r in curs.fetchall()}
    printt("\tok")
    return ret

def setupAll(curs):
    dataF = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/"
    dataF = os.path.join(dataF, "ver9/liftover/")
    fnp = os.path.join(dataF, "mm10-to-hg19-50.bed")
    tableName = "mm10_liftover"
    setupLiftover(curs, tableName)

    print("reading", fnp)
    with open(fnp) as f:
        mmToHg = [r.rstrip().split('\t') for r in f.readlines()]
        printt("\tok")

    mmLookup = getMpToAccLookup(curs, "mm10")
    hgLookup = getMpToAccLookup(curs, "hg19")

    for idx, r in enumerate(mmToHg):
        try:
            mmToHg[idx][3] = mmLookup[r[3]]
        except:
            print("bad liftOver?", idx, r)
        try:
            mmToHg[idx][4] = hgLookup[r[4]]
        except:
            print("bad liftOver?", idx, r)

    cols = "chrom start stop mouseAccession humanAccession overlap".split(' ')
    print("writing stringio...")
    outF = StringIO.StringIO()
    for r in mmToHg:
        outF.write("\t".join(r) + '\n')
    outF.seek(0)
    printt("\tok")

    print("copy into db...")
    curs.copy_from(outF, tableName, '\t', columns=cols)
    printt("\tok")

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    with getcursor(DBCONN, "main") as curs:
        setupAll(curs)

if __name__ == '__main__':
    main()

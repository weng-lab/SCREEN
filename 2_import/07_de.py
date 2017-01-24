#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs

def setupAndCopy(curs, tableName):
    print("dropping and creating", tableName)
    curs.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName}(
id serial PRIMARY KEY,
leftName text,
rightName text,
ensembl text,
log2FoldChange numeric,
padj numeric
);
""".format(tableName = tableName))
    print("\tok")

def setupAll(curs):
    dataF = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/"
    dataF = os.path.join(dataF, "mouse_epigenome/de_all_pairs")
    fnp = os.path.join(dataF, "DE_files.json")

    tableName = "mm10_de"
    setupAndCopy(curs, tableName)

    cols = ["leftName", "rightName", "ensembl", "log2FoldChange", "padj"]
    # baseMean	log2FoldChange	lfcSE	stat	pvalue	padj

    with open(fnp) as f:
        pairs = json.load(f)

    counter = 0
    total = len(pairs)
    for p, fn in pairs.iteritems():
        toks = p.split(':')
        left = toks[0]
        right = toks[1]
        if left == right:
            continue
        fnp = os.path.join(dataF, "data", fn + ".gz")
        print(counter + 1, total, fnp)
        counter += 1
        skipped = 0
        with gzip.open(fnp) as f:
            f.readline() # consume header
            data = []
            for r in f:
                toks = r.rstrip().split('\t')
                if "NA" == toks[2]:
                    skipped += 1
                    continue
                padj = toks[5]
                if 'NA' == padj:
                    padj = "1"
                data.append([toks[0], toks[2], padj])

        outF = StringIO.StringIO()
        for d in data:
            outF.write('\t'.join([left, right] + d) + '\n')
        outF.seek(0)
        curs.copy_from(outF, tableName, '\t', columns=cols)
        print("\tcopied in", len(data), "skipped", skipped)

def index(curs):
    curs.execute("""
    create index leftname_rightname_de on mm10_de(leftname, rightname)""")
    print("made index", "leftname_rightname_de")
    curs.execute("""
    create index ensembl_de on mm10_de(ensembl)""")
    print("made index", "ensembl_de")

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--index', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    with getcursor(DBCONN, "main") as curs:
        if args.index:
            return index(curs)
        setupAll(curs)
        index(curs)

if __name__ == '__main__':
    main()

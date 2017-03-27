#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex
from files_and_paths import Dirs

class ImportDE:
    def __init__(self, curs):
        self.curs = curs
        self.tableName = "mm10_de"
        self.ctTableName = "mm10_de_cts"

    def setupDb(self):
        printt("dropping and creating", self.tableName)
        self.curs.execute("""
    DROP TABLE IF EXISTS {tn};
    CREATE TABLE {tn}(
    id serial PRIMARY KEY,
    leftCtId integer,
    rightCtId integer,
    ensembl text,
    log2FoldChange real,
    padj numeric
    );
    """.format(tn = self.tableName))

        printt("dropping and creating", self.ctTableName)
        self.curs.execute("""
    DROP TABLE IF EXISTS {tn};
    CREATE TABLE {tn}(
    id serial PRIMARY KEY,
    deCtName text,
    biosample_summary text,
    tissues text
    );
    """.format(tn = self.ctTableName))

    def setupCellTypes(self, cts):
        outF = StringIO.StringIO()
        for ct in sorted(list(cts)):
            outF.write(ct + '\n')
        outF.seek(0)

        printt("copying into", self.ctTableName)
        cols = ["deCtName"]
        self.curs.copy_from(outF, self.ctTableName, '\t', columns=cols)
        printt("imported", self.curs.rowcount, "rows", self.ctTableName)

        self.curs.execute("""
        SELECT id, deCtName FROM {tn}
    """.format(tn = self.ctTableName))
        ctsToId = {r[1] : r[0] for r in self.curs.fetchall()}
        return ctsToId

    def loadFileLists(self):
        cts = set()
        d = os.path.join(paths.v4d, "mouse_epigenome/de_all_pairs/data")
        fnps = []
        for fn in os.listdir(d):
            if not fn.endswith(".txt.gz"):
                continue
            toks = fn.replace(".txt.gz", '').split("_VS_")
            cts.add(toks[0])
            cts.add(toks[1])
            fnps.append((os.path.join(d, fn), toks[0], toks[1]))
        return cts, fnps

    def readFile(self, fnp):
        with gzip.open(fnp) as f:
            f.readline() # consume header
            data = []
            skipped = 0
            for r in f:
                toks = r.rstrip().split('\t')
                if "NA" == toks[2]:
                    skipped += 1
                    continue
                padj = toks[5]
                if 'NA' == padj:
                    padj = "1"
                etoks = toks[0].split('.')
                data.append([etoks[0], toks[2], padj])
        return data, skipped

    def setupAll(self, sample):
        self.setupDb()

        cts, fnps = self.loadFileLists()
        ctsToId = self.setupCellTypes(cts)

        cols = ["leftCtId", "rightCtId", "ensembl", "log2FoldChange", "padj"]
        # baseMean	log2FoldChange	lfcSE	stat	pvalue	padj

        counter = 0
        for fnp, ct1, ct2 in fnps:
            counter += 1
            if sample:
                #if "_0" not in ct1 and "_0" not in ct2:
                if "limb_15" not in ct1 or "limb_11" not in ct2:
                    continue
            printt(counter, len(fnps), fnp)
            data, skipped = self.readFile(fnp)

            outF = StringIO.StringIO()
            for d in data:
                outF.write('\t'.join([str(ctsToId[ct1]),
                                      str(ctsToId[ct2])] + d) + '\n')
            outF.seek(0)

            self.curs.copy_from(outF, self.tableName, '\t', columns=cols)
            printt("copied in", self.curs.rowcount, "skipped", skipped)

    def index(self):
        makeIndex(self.curs, self.tableName, ["leftCtId", "rightCtId", "ensembl"])

def run(args, DBCONN):
    printt('***********', "mm10")
    with getcursor(DBCONN, "import DEs") as curs:
        ide = ImportDE(curs)
        if args.index:
            return ide.index()
        ide.setupAll(args.sample)
        ide.index()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--index', action="store_true", default=False)
    parser.add_argument('--sample', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    return run(args, DBCONN)

if __name__ == '__main__':
    main()

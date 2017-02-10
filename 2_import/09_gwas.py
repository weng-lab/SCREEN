#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from exp import Exp
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs

def setupEnrichment(curs, tableName):
    # author-pubMedID-trait, expEnrichedIn, foldEnrichment, fdr, ignore!
    curs.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName}(
id serial PRIMARY KEY,
author text,
pubmed text,
trait text,
authorPubmedTrait text,
expID text,
foldEnrichment real,
fdr real,
biosample_term_name text
);
""".format(tableName = tableName))

def setupGWAS(curs, tableName):
    # chr1    62963737        62963737        rs1002687       rs11207995      0.85    25961943-2      Cholesterol     25961943        Surakka"""
    # snpItself       taggedSNP       r2      unqiueLDblock(pubmed-num)       trait   pubmed  firstAuthor""
    curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}(
id serial PRIMARY KEY,
chrom text,
start integer,
stop integer,
snp text,
taggedSNP text,
r2 real,
ldblock text,
trait text,
pubmed text,
author text,
authorPubmedTrait text
);
""".format(tableName = tableName))

def setupAll(curs):
    dataF = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/"
    dataF = os.path.join(dataF, "GWAS")

    # GWAS enrichment
    fnp = os.path.join(dataF, "GWAS.Enrichment.v0.txt")
    tableName = "hg19_gwas_enrichment"
    setupEnrichment(curs, tableName)
    outF = StringIO.StringIO()
    with open(fnp) as f:
        rows = [r.rstrip().split('\t') for r in f if r]
    for r in rows:
        toks = r[0].split('-')
        r = toks + r[:-1]
        r[4] = r[4].strip()
        exp = Exp.fromJsonFile(r[4])
        r.append(exp.biosample_term_name)
        print(r)
        outF.write('\t'.join(r) + '\n')
    outF.seek(0)
    cols = ["author", "pubmed", "trait", "authorPubmedTrait",
            "expID", "foldEnrichment", "fdr", "biosample_term_name"]
    print(cols)
    curs.copy_from(outF, tableName, '\t', columns=cols)
    print("\tcopied in", curs.rowcount)

    # GWAS bed
    fnp = os.path.join(dataF, "GWAS.v0.bed")
    tableName = "hg19_gwas"
    setupGWAS(curs, tableName)
    outF = StringIO.StringIO()
    with open(fnp) as f:
        rows = [r.rstrip().split('\t') for r in f if r]
    for r in rows:
        if '*' == r[5]:
            r[5] = "-1"
        if 'Lead' == r[4]:
            r[4] = r[3]
        r[2] = str(int(r[2]) + 1)
        r.append('-'.join([r[-1], r[-2], r[-3]]))
        outF.write('\t'.join(r) + '\n')
    outF.seek(0)

    cols = "chrom start stop snp taggedSNP r2 ldblock trait pubmed author authorPubmedTrait".split(' ')
    curs.copy_from(outF, tableName, '\t', columns=cols)
    print("\tcopied in", curs.rowcount)

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

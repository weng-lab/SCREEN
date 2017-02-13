#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from exp import Exp
from utils import Utils, printt
from db_utils import getcursor
from files_and_paths import Dirs

def setupStudies(curs, tableName):
    curs.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName}(
id serial PRIMARY KEY,
author text,
pubmed text,
trait text,
authorPubmedTrait text
);
""".format(tableName = tableName))

def _studies(curs, fnp):
    # GWAS enrichment
    printt("reading", fnp)
    with open(fnp) as f:
        header = f.readline().rstrip('\n').split('\t')

    tableName = "hg19_gwas_studies"
    printt("drop/create", tableName)
    setupStudies(curs, tableName)

    printt("rewrite rows")
    outF = StringIO.StringIO()
    for authorPubmedTrait in header[2:]:
        print(authorPubmedTrait)
        toks = authorPubmedTrait.split('-')
        authorPubmedTrait = authorPubmedTrait.replace('-', '_')
        r = toks + [authorPubmedTrait]
        outF.write('\t'.join(r) + '\n')
    outF.seek(0)
    cols = ["author", "pubmed", "trait", "authorPubmedTrait"]
    print(cols)

    printt("import to db")
    curs.copy_from(outF, tableName, '\t', columns=cols)
    print("\tcopied in", curs.rowcount)

def setupEnrichment(curs, tableName, fields):
    # author-pubMedID-trait, expEnrichedIn, foldEnrichment, fdr, ignore!
    curs.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName}(
id serial PRIMARY KEY,
expID text,
cellTypeName text,
biosample_term_name text,
{fields}
);
""".format(tableName = tableName,
           fields = ','.join([r + " real" for r in fields])))

def _enrichment(curs, fnp):
    # GWAS enrichment
    printt("reading", fnp)
    with open(fnp) as f:
        header = f.readline().rstrip('\n').split('\t')
        rows = [r.rstrip('\n').split('\t') for r in f if r]

    tableName = "hg19_gwas_enrichment"
    fields = [f.replace('-', '_') for f in header[2:]]
    printt("drop/create", tableName)
    setupEnrichment(curs, tableName, fields)

    printt("rewrite rows")
    outF = StringIO.StringIO()
    for r in rows:
        exp = Exp.fromJsonFile(r[0])
        r.insert(2, exp.biosample_term_name)
        outF.write('\t'.join(r) + '\n')
    outF.seek(0)
    cols = ["expID", "cellTypeName", "biosample_term_name"] + fields
    print(cols)

    printt("import to db")
    curs.copy_from(outF, tableName, '\t', columns=cols)
    print("\tcopied in", curs.rowcount)

    if 0:
        curs.execute("""
UPDATE hg19_gwas_enrichment as ge
set cellTypeName = d.cellTypeName
from hg19_datasets as d
where ge.expID = d.expID""")
        printt("updated", curs.rowcount)

def setupGWAS(curs, tableName):
    # chr1    62963737        62963737        rs1002687       rs11207995      0.85    25961943-2      Cholesterol     25961943        Surakka"""
    #                                         snpItself       taggedSNP       r2      unqiueLDblock(pubmed-num)       trait   pubmed  firstAuthor""
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

def _gwas(curs, fnp):
    # GWAS bed
    printt("reading", fnp)
    with open(fnp) as f:
        rows = [r.rstrip().split('\t') for r in f if r]

    tableName = "hg19_gwas"
    printt("drop/create", tableName)
    setupGWAS(curs, tableName)

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
    print("split rows", len(rows), "to", len(split))

    printt("rewrite rows")
    outF = StringIO.StringIO()
    for idx, r in enumerate(split):
        if 'Lead' == r[4]:
            r[4] = r[3]
        if '*' == r[5]:
            r[5] = "-1"
        r[2] = str(int(r[2]) + 1)
        r.append('_'.join([r[-1], r[-2], r[-3]]))
        if 0 == idx:
            print("example", '\t'.join(r))
        if '*' in '\t'.join(r):
            print(r)
            raise Exception("invalid line")
        outF.write('\t'.join(r) + '\n')
    outF.seek(0)

    cols = "chrom start stop snp taggedSNP r2 ldblock trait pubmed author authorPubmedTrait".split(' ')
    curs.copy_from(outF, tableName, '\t', columns=cols)
    print("\tcopied in", curs.rowcount)

def setupAll(curs):
    dataF = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/"
    dataF = os.path.join(dataF, "GWAS")

    fnp = os.path.join(dataF, "GWAS.Enrichment.v1.Matrix.txt")
    _studies(curs, fnp)
    _enrichment(curs, fnp)

    fnp = os.path.join(dataF, "GWAS.v1.bed")
    _gwas(curs, fnp)

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

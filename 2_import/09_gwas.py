#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from exp import Exp
from utils import Utils, printt, printWroteNumLines, cat
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs

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
    printt("******************* GWAS")
    printt("reading", fnp)
    with open(fnp) as f:
        rows = [r.rstrip().split('\t') for r in f if r]

    tableName = "hg19_gwas"
    printt("drop/create", tableName)
    setupGWAS(curs, tableName)

    printt("rewrite rows")
    outF = StringIO.StringIO()
    for r in rows:
        if 'Lead' == r[4]:
            r[4] = r[3]
        if '*' == r[5]:
            r[5] = "-1"
        r[2] = str(int(r[2]) + 1)
        if '*' in '\t'.join(r):
            print(r)
            raise Exception("invalid line")
        outF.write('\t'.join(r) + '\n')
    print("example", '\t'.join(r))
    outF.seek(0)

    cols = "chrom start stop snp taggedSNP r2 ldblock trait pubmed author authorPubmedTrait".split(' ')
    curs.copy_from(outF, tableName, '\t', columns=cols)
    print("copied in", curs.rowcount)

    makeIndex(curs, tableName, ["chrom", "authorPubmedTrait", "ldblock"])
    makeIndexIntRange(curs, tableName, ["start", "stop"])

def setupEnrichment(curs, tableName, fields):
    curs.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName}(
id serial PRIMARY KEY,
expID text,
cellTypeName text,
biosample_summary text,
{fields}
);
""".format(tableName = tableName,
           fields = ','.join([r + " real" for r in fields])))

def _enrichment(curs, fnp):
    printt("******************* GWAS enrichment")
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
        for idx in xrange(3, len(r)):
            r[idx] = str(round(-1.0 * math.log10(float(r[idx])), 2))
        outF.write('\t'.join(r) + '\n')
    outF.seek(0)
    cols = ["expID", "cellTypeName"] + fields
    print(cols)

    printt("import to db")
    curs.copy_from(outF, tableName, '\t', columns=cols)
    printt("\tcopied in", curs.rowcount)

    curs.execute("""
UPDATE hg19_gwas_enrichment as ge
set cellTypeName = d.cellTypeName,
biosample_summary = d.biosample_summary
from hg19_datasets as d
where ge.expID = d.expID""")
    printt("updated", curs.rowcount)

def setupStudies(curs, tableName):
    curs.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName}(
id serial PRIMARY KEY,
author text,
pubmed text,
trait text,
authorPubmedTrait text,
numLDblocks integer
);
""".format(tableName = tableName))

def _studies(curs, fnp):
    printt("******************* GWAS studies")
    printt("reading", fnp)
    with open(fnp) as f:
        header = f.readline().rstrip('\n').split('\t')

    tableName = "hg19_gwas_studies"
    printt("drop/create", tableName)
    setupStudies(curs, tableName)

    printt("import to db")
    curs.execute("""
INSERT INTO {tn} (authorpubmedtrait,  author, pubmed, trait, numLDblocks)
SELECT DISTINCT(authorpubmedtrait), author, pubmed, trait, COUNT(DISTINCT(ldblock))
FROM {gwasTn}
GROUP BY authorpubmedtrait, author, pubmed, trait
 """.format(tn = tableName, gwasTn = "hg19_gwas"))
    printt("inserted", curs.rowcount)

    curs.execute("""
SELECT authorpubmedtrait
FROM {tn}
ORDER BY authorpubmedtrait
 """.format(tn = tableName))
    return [r[0] for r in curs.fetchall()]

def processGwasBed(origBedFnp, bedFnp):
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

def setupOverlap(curs, tableName):
    curs.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName}(
id serial PRIMARY KEY,
authorPubmedTrait text,
accession text,
snp text
);
""".format(tableName = tableName))

def _overlap(curs, bedFnp):
    printt("******************* GWAS overlap")
    tableName = "hg19_gwas_overlap"
    setupOverlap(curs, tableName)

    printt("running bedtools intersect...")
    cmds = [cat(bedFnp),
            '|', "cut -f -4,11-",
            '|', "bedtools intersect",
            "-a", "-",
            "-b", paths.path("hg19", "raw", "masterPeaks.sorted.bed"),
            "-wo",
            "-sorted"]
    snpsIntersecting = Utils.runCmds(cmds)
    print("example", snpsIntersecting[0].rstrip('\n').split('\t'))

    printt("rewriting...")
    outF = StringIO.StringIO()
    for r in snpsIntersecting:
        toks = r.rstrip('\n').split('\t')
        snp = toks[3]
        authorPubmedTrait = toks[4].replace('-', '_')
        accession = toks[9]

        if '_' not in authorPubmedTrait:
            print(r)
            print(toks)
            raise Exception("bad authorPubmedTrait?")
        if not snp.startswith("rs"):
            print(r)
            print(toks)
            raise Exception("bad rs?")
        if not accession.startswith("EH3"):
            print(r)
            print(toks)
            raise Exception("bad line?")
        outF.write('\t'.join([authorPubmedTrait, accession, snp]) + '\n')
    print("example", '\t'.join([authorPubmedTrait, accession, snp]))
    outF.seek(0)

    printt("copying into DB...")
    cols = "authorPubmedTrait accession snp".split(' ')
    curs.copy_from(outF, tableName, '\t', columns=cols)
    printt("copied in", curs.rowcount)

    makeIndex(curs, tableName, ["authorPubmedTrait"])

def setupAll(curs):
     dataF = os.path.join(paths.v4d, "GWAS")

     origBedFnp = os.path.join(dataF, "GWAS.v2.bed")
     bedFnp = os.path.join(dataF, "GWAS.v2.sorted.bed")
     processGwasBed(origBedFnp, bedFnp)

     _gwas(curs, bedFnp)

     enrichFnp = os.path.join(dataF, "GWAS.Enrichment.v2.Matrix.txt")
     _enrichment(curs, enrichFnp)
     _studies(curs, enrichFnp)
     _overlap(curs, bedFnp)

def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    with getcursor(DBCONN, "main") as curs:
        setupAll(curs)

if __name__ == '__main__':
    main()

#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from exp import Exp
from utils import Utils, printt, printWroteNumLines, cat
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs

class ImportGwas:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableNameGwas = assembly + "_gwas"
        self.tableNameEnrichment = assembly + "_gwas_enrichment"
        self.tableNameDatasets = assembly + "_datasets"
        self.tableNameStudies = assembly + "_gwas_studies"
        self.tableNameOverlap = assembly + "_gwas_overlap"
                
    def setupGWAS(self):
        # chr1    62963737        62963737        rs1002687       rs11207995      0.85    25961943-2      Cholesterol     25961943        Surakka"""
        #                                         snpItself       taggedSNP       r2      unqiueLDblock(pubmed-num)       trait   pubmed  firstAuthor""
        printt("drop/create", self.tableNameGwas)
        
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};
        CREATE TABLE {tn}(
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
        """.format(tn = self.tableNameGwas))

    def _gwas(self, fnp):
        printt("******************* GWAS")
        printt("reading", fnp)
        with open(fnp) as f:
            rows = [r.rstrip().split('\t') for r in f if r]

        self.setupGWAS()

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
        self.curs.copy_from(outF, self.tableNameGwas, '\t', columns=cols)
        print("copied in", self.curs.rowcount)

        makeIndex(self.curs, self.tableNameGwas,
                  ["chrom", "authorPubmedTrait", "ldblock"])
        makeIndexIntRange(self.curs, self.tableNameGwas, ["start", "stop"])

    def _setupEnrichment(self, fields):
        printt("drop/create", self.tableNameEnrichment)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};

        CREATE TABLE {tn}(
        id serial PRIMARY KEY,
        expID text,
        cellTypeName text,
        biosample_summary text,
        {fields}
        );
        """.format(tn = self.tableNameEnrichment,
                   fields = ','.join([r + " real" for r in fields])))

    def _enrichment(self, fnp):
        printt("******************* GWAS enrichment")
        printt("reading", fnp)
        with open(fnp) as f:
            header = f.readline().rstrip('\n').split('\t')
            rows = [r.rstrip('\n').split('\t') for r in f if r]

        fields = [f.replace('-', '_') for f in header[2:]]
        self._setupEnrichment(fields)

        printt("rewrite rows")
        outF = StringIO.StringIO()
        for r in rows:
            for idx in xrange(3, len(r)):
                if not r[idx]:
                    r[idx] = str(0)
                else:
                    try:
                        r[idx] = str(round(-1.0 * math.log10(float(r[idx])), 2))
                    except:
                        print("error parsing")
                        print(r)
                        print("idx:", idx)
                        print("value:", r[idx])
                        raise
            outF.write('\t'.join(r) + '\n')
        outF.seek(0)
        cols = ["expID", "cellTypeName"] + fields
        print(cols)

        printt("import to db")
        self.curs.copy_from(outF, self.tableNameEnrichment, '\t', columns=cols)
        printt("\tcopied in", self.curs.rowcount)

        self.curs.execute("""
    UPDATE {tne} as ge
    set cellTypeName = d.cellTypeName,
    biosample_summary = d.biosample_summary
    from {tnd} as d
    where ge.expID = d.expID
        """.format(tne = self.tableNameEnrichment, tnd = self.tableNameDatasets))
        printt("updated", self.curs.rowcount)
        
    def _setupStudies(self):
        printt("drop/create", self.tableNameStudies)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};

        CREATE TABLE {tn}(
        id serial PRIMARY KEY,
        author text,
        pubmed text,
        trait text,
        authorPubmedTrait text,
        numLDblocks integer
        );
        """.format(tn = self.tableNameStudies))

    def _studies(self, fnp):
        printt("******************* GWAS studies")
        printt("reading", fnp)
        with open(fnp) as f:
            header = f.readline().rstrip('\n').split('\t')
        
        self._setupStudies()

        printt("import to db")
        self.curs.execute("""
    INSERT INTO {tn} (authorpubmedtrait,  author, pubmed, trait, numLDblocks)
    SELECT DISTINCT(authorpubmedtrait), author, pubmed, trait, COUNT(DISTINCT(ldblock))
    FROM {gwasTn}
    GROUP BY authorpubmedtrait, author, pubmed, trait
     """.format(tn = self.tableNameStudies,
                gwasTn = self.tableNameGwas))
        printt("inserted", self.curs.rowcount)

        self.curs.execute("""
    SELECT authorpubmedtrait
    FROM {tn}
    ORDER BY authorpubmedtrait
     """.format(tn = self.tableNameStudies))
        return [r[0] for r in self.curs.fetchall()]

    def processGwasBed(self, origBedFnp, bedFnp):
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

    def _setupOverlap(self):
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};

        CREATE TABLE {tn}(
        id serial PRIMARY KEY,
        authorPubmedTrait text,
        accession text,
        snp text
        );
        """.format(tn = self.tableNameOverlap))

    def _overlap(self, bedFnp):
        printt("******************* GWAS overlap")
        self._setupOverlap()

        cresFnp = paths.path(self.assembly, "extras", "cREs.sorted.bed")
        if not os.path.exists(cresFnp):
            Utils.sortFile(paths.path(self.assembly, "raw", "cREs.bed"),
                           cresFnp)

        printt("running bedtools intersect...")
        cmds = [cat(bedFnp),
                '|', "cut -f -4,11-",
                '|', "bedtools intersect",
                "-a", "-",
                "-b", cresFnp,
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
        self.curs.copy_from(outF, self.tableNameOverlap, '\t', columns=cols)
        printt("copied in", self.curs.rowcount)

        makeIndex(self.curs, self.tableNameOverlap, ["authorPubmedTrait"])

    def run(self):
        dataF = paths.path(self.assembly, "gwas", "h3k27ac")
        
        origBedFnp = os.path.join(dataF, "GWAS.v3.bed")
        bedFnp = os.path.join(dataF, "GWAS.v3.sorted.bed")
        self.processGwasBed(origBedFnp, bedFnp)
        
        self._gwas(bedFnp)
        
        enrichFnp = os.path.join(dataF, "GWAS.Enrichment.v3.Matrix.txt")
        self._enrichment(enrichFnp)
        self._studies(enrichFnp)
        self._overlap(bedFnp)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = ["hg19"] #Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        with getcursor(DBCONN, "main") as curs:
            ig = ImportGwas(curs, assembly)
            ig.run()
            
if __name__ == '__main__':
    main()

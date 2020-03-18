#!/usr/bin/env python3


import os
import sys
import json
import psycopg2
import argparse
import io
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths, GwasVersion
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../utils/'))
from exp import Exp
from utils import Utils, printt, printWroteNumLines, cat, importedNumRows, updatedNumRows
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs


class ImportGwas:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableNameGwas = assembly + "_gwas"
        self.tableNameEnrichmentPval = assembly + "_gwas_enrichment_pval"
        self.tableNameEnrichmentFdr = assembly + "_gwas_enrichment_fdr"
        self.tableNameDatasets = assembly + "_datasets"
        self.tableNameStudies = assembly + "_gwas_studies"
        self.tableNameOverlap = assembly + "_gwas_overlap"
        self.version = GwasVersion

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
        r2 real[],
        ldblock text,
        trait text,
        pubmed text,
        author text,
        authorPubmedTrait text
        );
        """.format(tn=self.tableNameGwas))

    def _gwas(self, fnp):
        printt("******************* GWAS")
        printt("reading", fnp)
        with open(fnp) as f:
            rows = [r.rstrip().split('\t') for r in f if r]

        self.setupGWAS()

        printt("rewrite rows")
        outF = io.StringIO()
        for r in rows:
            if 'Lead' == r[4]:
                r[4] = r[3]
            r[5] = "{%s}" % r[5].replace('*', "-1")
            r[2] = str(int(r[2]) + 1)
            r[-1] = r[-1].replace('-', '_')
            outF.write('\t'.join(r) + '\n')
        print("example", '\t'.join(r))
        outF.seek(0)

        cols = "chrom start stop snp taggedSNP r2 ldblock trait author pubmed authorPubmedTrait".split(' ')
        self.curs.copy_from(outF, self.tableNameGwas, '\t', columns=cols)
        importedNumRows(self.curs)

        makeIndex(self.curs, self.tableNameGwas,
                  ["chrom", "authorPubmedTrait", "ldblock", "snp"])
        makeIndexIntRange(self.curs, self.tableNameGwas, ["start", "stop"])

    def _setupEnrichment(self, fields, tableName):
        printt("drop/create", tableName)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};

        CREATE TABLE {tn}(
        id serial PRIMARY KEY,
        expID text,
        cellTypeName text,
        biosample_summary text,
        {fields}
        );
        """.format(tn=tableName,
                   fields=','.join([r + " real" for r in fields])))

    def _enrichment(self):
        files = ((".Matrix.pvalue.txt", self.tableNameEnrichmentPval, False, [116, 172]),
                 (".Matrix.FDR.txt", self.tableNameEnrichmentFdr, True, [116, 172]))
        headers = []
        for fn, tableName, takeLog, skip in files:
            printt("******************* GWAS enrichment", fn)
            header = self._do_enrichment(fn, tableName, takeLog, skip)
            headers.append(header)
        if headers[0] != headers[1]:
            print(headers[0])
            print(headers[1])
            raise Exception("different headers?")
        return headers[0]

    def _do_enrichment(self, fnBase, tableName, takeLog, skip = []):
        fnp = paths.gwasFnp(self.assembly, self.version, fnBase)
        printt("reading", fnp)
        with open(fnp) as f:
            header = f.readline().rstrip('\n').split('\t')
            rows = [r.rstrip('\n').split('\t') for r in f if r]

        fields = [f.replace('-', '_').replace("'", '_') for f in header[2:]]
        fields = [fields[i] for i in range(len(fields)) if i + 2 not in skip]
        self._setupEnrichment(fields, tableName)

        printt("rewrite rows")
        outF = io.StringIO()
        for r in rows:
            for idx in range(2, len(r)):
                r[idx] = str(float(r[idx]))
            r = [r[i] for i in range(len(r)) if i + 2 not in skip]
            outF.write('\t'.join(r) + '\n')
        outF.seek(0)
        cols = ["expID", "cellTypeName"] + fields
        print(cols)

        printt("import to db")
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        importedNumRows(self.curs)

        self.curs.execute("""
        UPDATE {tne} as ge
        set cellTypeName = d.cellTypeName,
        biosample_summary = d.biosample_summary
        from {tnd} as d
        where ge.expID = d.expID
        """.format(tne=tableName, tnd=self.tableNameDatasets))
        updatedNumRows(self.curs)

        return header

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
        """.format(tn=self.tableNameStudies))

    def _studies(self, header):
        printt("******************* GWAS studies")
        self._setupStudies()

        printt("import to db")
        self.curs.execute("""
    INSERT INTO {tn} (authorpubmedtrait,  author, pubmed, trait, numLDblocks)
    SELECT DISTINCT(authorpubmedtrait), author, pubmed, trait, COUNT(DISTINCT(ldblock))
    FROM {gwasTn}
    GROUP BY authorpubmedtrait, author, pubmed, trait
     """.format(tn=self.tableNameStudies,
                gwasTn=self.tableNameGwas))
        importedNumRows(self.curs)

        self.curs.execute("""
    SELECT authorpubmedtrait
    FROM {tn}
    ORDER BY authorpubmedtrait
     """.format(tn=self.tableNameStudies))
        return [r[0] for r in self.curs.fetchall()]

    def _setupOverlap(self):
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};

        CREATE TABLE {tn}(
        id serial PRIMARY KEY,
        authorPubmedTrait text,
        accession text,
        snp text
        );
        """.format(tn=self.tableNameOverlap))

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
                "-wo" ]
        snpsIntersecting = Utils.runCmds(cmds)
        print("example", snpsIntersecting[0].rstrip('\n').split('\t'))

        printt("rewriting...")
        outF = io.StringIO()
        count = {}
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
            if authorPubmedTrait not in count: count[authorPubmedTrait] = 0
            count[authorPubmedTrait] += 1
        print("example", '\t'.join([authorPubmedTrait, accession, snp]))
        for k, v in count.items():
            print("%s: %d" % (k, v))
        outF.seek(0)

        printt("copying into DB...")
        cols = "authorPubmedTrait accession snp".split(' ')
        self.curs.copy_from(outF, self.tableNameOverlap, '\t', columns=cols)
        importedNumRows(self.curs)

        makeIndex(self.curs, self.tableNameOverlap, ["authorPubmedTrait"])

    def run(self):
        dataF = paths.path(self.assembly, "gwas", "h3k27ac")

        origBedFnp = paths.gwasFnp(self.assembly, self.version, ".bed")
        bedFnp = paths.gwasFnp(self.assembly, self.version, ".sorted.bed")

        self._gwas(bedFnp)
        header = self._enrichment()
        self._studies(header)
        self._overlap(bedFnp)


def run(args, DBCONN):
    assemblies = ["hg19"]  # Config.assemblies

    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        if "hg19" != assembly:
            print("skipping...")
            continue
        printt('***********', assembly)
        with getcursor(DBCONN, "main") as curs:
            ig = ImportGwas(curs, assembly)
            ig.run()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)


if __name__ == '__main__':
    main()

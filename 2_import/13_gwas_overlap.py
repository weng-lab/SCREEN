#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs

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

def gwasOverlapWithCres(curs, gwas_study):
    print(gwas_study)
    q = """
SELECT cre.accession, gwas.snp
FROM hg19_gwas as gwas, hg19_cre as cre
WHERE gwas.chrom = cre.chrom
AND int4range(gwas.start, gwas.stop) && int4range(cre.start, cre.stop)
AND gwas.authorPubmedTrait = %s
""".format(tn = "hg19_gwas")
    curs.execute(q, (gwas_study, ))
    return [[r[0], r[1]] for r in curs.fetchall()]


def setupAll(curs):
    tableName = "hg19_gwas_overlap"
    setupOverlap(curs, tableName)

    outF = StringIO.StringIO()

    for gwas_study in ["Speedy-24292274-Chronic lymphocytic leukemia",
                       "Surakka-25961943-Cholesterol",
                       "Arking-24952745-QT Interval"]:
        accessionAndSnp = gwasOverlapWithCres(curs, gwas_study)
        for a in accessionAndSnp:
            outF.write('\t'.join([gwas_study] + a) + '\n')

    outF.seek(0)

    cols = ["authorPubmedTrait", "accession", "snp"]
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

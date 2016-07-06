#!/usr/bin/env python

import os, sys, json, psycopg2, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils
from dbs import DBS
from files_and_paths import Dirs
from db_utils import getcursor
from get_tss import Genes

class LookupGenes:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN
        self.tableNames = {"mm10" : "genes_mm10",
                           "hg19" : "genes_hg19"}

    def lookup(self, assembly, gene):
        with getcursor(self.DBCONN, "lookup") as curs:
            curs.execute("""
SELECT chrom, chromStart, chromEnd FROM {table}
WHERE lower(gene) = lower(%(gene)s)
""".format(table=self.tableNames[assembly]),
                             {"gene" : gene})
            if (curs.rowcount > 0):
                return curs.fetchall()
            return None

    def fuzzy_lookup(self, assembly, gene):
        with getcursor(self.DBCONN, "lookup") as curs:
            curs.execute("""
SELECT gene FROM {table}
WHERE gene ~ lower(%(gene)s)
""".format(table=self.tableNames[assembly]),
                             {"gene" : gene})
            if (curs.rowcount > 0):
                return [x[0] for x in curs.fetchall()]
            return None

def setupAndCopy(cur, fnp, fileType, table_name):
    print "loading", fnp

    cur.execute("""
DROP TABLE IF EXISTS {table};

CREATE TABLE {table}(
id serial PRIMARY KEY,
chrom varchar(31),
chromStart numeric,
chromEnd numeric,
gene text
);
""".format(table=table_name))

    ggff = Genes(fnp, fileType)

    outF = StringIO.StringIO()
    for g in ggff.getGenes():
        outF.write("\t".join([str(x) for x in [g.chr_, g.start_, g.end_, g.genename_]]) + "\n")

    outF.seek(0)
    cur.copy_from(outF, table_name, '\t',
                  columns=("chrom", "chromStart", "chromEnd", "gene"))
    print "\t", fnp, cur.rowcount
    cur.execute("""
    CREATE INDEX {table}_idx01 ON {table}(lower(gene));
""".format(table=table_name))

def setupAll(cur):
    setupAndCopy(cur, Dirs.GenomeFnp("gencode.m4/gencode.vM4.annotation.gtf.gz"),
                 "gtf", "genes_mm10")
    setupAndCopy(cur, Dirs.GenomeFnp("gencode.v19/gencode.v19.annotation.gff3.gz"),
                 "gff", "genes_hg19")

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    if args.local:
        dbs = DBS.localRegElmViz()
    else:
        dbs = DBS.pgdsn("regElmViz")
    dbs["application_name"] = os.path.realpath(__file__)

    import psycopg2.pool
    DBCONN = psycopg2.pool.ThreadedConnectionPool(1, 32, **dbs)

    with getcursor(DBCONN, "main") as cur:
        setupAll(cur)

if __name__ == '__main__':
    main()

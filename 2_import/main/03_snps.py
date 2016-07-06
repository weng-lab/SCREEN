#!/usr/bin/env python

import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils
from dbs import DBS
from files_and_paths import Dirs
from db_utils import getcursor

def setupAndCopy(cur, fnp, table_name):
    print "loading", fnp

    cur.execute("""
DROP TABLE IF EXISTS {table};

CREATE TABLE {table}(
id serial PRIMARY KEY,
chrom varchar(31),
chromStart numeric,
chromEnd numeric,
name varchar(15)
);
""".format(table=table_name))

    with open(fnp) as f:
        header = f.readline() # consume header line
        cur.copy_from(f, table_name, ',',
                      columns=("chrom", "chromStart", "chromEnd", "name"))

    cur.execute("""
CREATE INDEX {table}_idx01 ON {table}(name);
""".format(table=table_name))

def setupAll(cur):
    d = Dirs.dbsnps
    setupAndCopy(cur, os.path.join(d, "snps142common.mm10.csv"),
                 "dbsnps_mm10")
    setupAndCopy(cur, os.path.join(d, "snps144common.hg19.csv"),
                 "dbsnps_hg19")

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
        if 1:
            setupAll(cur)

if __name__ == '__main__':
    main()

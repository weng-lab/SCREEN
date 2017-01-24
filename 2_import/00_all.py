#!/usr/bin/env python

from __future__ import print_function
import argparse
import sys
import os
import psycopg2

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor

regelms = __import__('01_regelms')
pg_cre =  __import__('02_pg_cre')
cellTypeInfo = __import__('03_cellTypeInfo')
genealiases = __import__('04_genealiases')
snps =  __import__('05_snps')
correlate =  __import__('06_correlate')
de =  __import__('07_de')
gwas =  __import__('08_gwas')
liftover =  __import__('09_liftover')
peakIntersections =  __import__('10_peakIntersections')
tads =  __import__('11_tads')

def vacumnAnalyze(conn, tableName):
    # http://stackoverflow.com/a/1017655
    print("about to vacuum analyze", tableName)
    old_isolation_level = conn.isolation_level
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    curs = conn.cursor()
    curs.execute("vacuum analyze " + tableName)
    conn.set_isolation_level(old_isolation_level)

def vacAll(DBCONN):
    with getcursor(DBCONN, "pg") as curs:
        curs.execute("""SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public'""")
        tables = curs.fetchall()
    for t in tables:
        conn = DBCONN.getconn()
        vacumnAnalyze(conn, t[0])
        DBCONN.putconn(conn)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--vac', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    if args.vac:
        vacAll(DBCONN)

    return 0

if __name__ == '__main__':
    main()

#!/usr/bin/env python

import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from helpers_metadata import Exp
from utils import Utils
from metadataws import MetadataWS

def setupDB(cur, species):
    cur.execute("""
DROP TABLE IF EXISTS r_genes;
CREATE TABLE r_genes AS
SELECT DISTINCT r.ensembl_id, r.gene_name FROM r_expression AS r
""")

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    for dataset in [Datasets.all_human]:
        DBCONN = db_connect(os.path.realpath(__file__), args.local)
        with getcursor(DBCONN, "03_genes") as curs:
            setupDB(curs, dataset.species)

if __name__ == '__main__':
    main()

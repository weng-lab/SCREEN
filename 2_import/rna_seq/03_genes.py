#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from exp import Exp
from utils import Utils, printt
from metadataws import MetadataWS

def setupDB(cur, assembly):
    gtn = "r_genes_" + assembly
    etn = "r_expression_" + assembly
    printt("dropping and creating", gtn)
    cur.execute("""
DROP TABLE IF EXISTS {gtn};
CREATE TABLE {gtn} AS
SELECT DISTINCT r.ensembl_id, r.gene_name FROM {etn} AS r
""".format(gtn = gtn, etn = etn))

def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    for assembly in ["mm10", "hg19"]:
        DBCONN = db_connect(os.path.realpath(__file__))
        with getcursor(DBCONN, "03_genes") as curs:
            print('***********', assembly)
            setupDB(curs, assembly)

if __name__ == '__main__':
    main()

#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from exp import Exp
from utils import Utils
from metadataws import MetadataWS


def get_expids(curs):
    curs.execute("SELECT encode_id FROM r_rnas")
    return curs.fetchall()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    for dataset in [Datasets.all_human]:

        # get datasets from database
        DBCONN = db_connect(os.path.realpath(__file__), args.local)
        with getcursor(DBCONN, "06_de") as curs:
            expids = get_expids(curs)
            
        # download all gene quantification TSVs
        for accession in expids:
            e = Exp.fromJsonFile(accession)
            gqs = filter(lambda f: f.output_type == "gene quantifications",
                         e.files)
            for _file in gqs:
                _file.download()                

if __name__ == '__main__':
    main()

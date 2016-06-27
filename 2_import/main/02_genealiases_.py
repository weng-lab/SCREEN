#!/usr/bin/env python

from __future__ import print_function
import os, sys
import requests
import argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
sys.path.append("../../common")
from es_bulk_importer import ESBulkImporter
from utils import Utils
from files_and_paths import Dirs, Tools, Genome, Datasets

def parseargs():
    parser = argparse.ArgumentParser()
    parser.add_argument('--rootpath', type=str, default="../../data/")
    parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
    parser.add_argument('--elasticsearch_port', type=int, default=9200)
    parser.add_argument('--debug', action="store_true", default=False)
    return parser.parse_args()

def main():
    args = parseargs()
    importer = ESBulkImporter(args.elasticsearch_server, args.elasticsearch_port)

    fn = 'genelist.lsj'
    d = os.path.join(Dirs.encyclopedia, "Version-4")
    fnp = os.path.join(d, fn)

    try:
        importer.do_import(fnp, "gene_aliases", doc_type="gene")
    except:
        if args.debug: raise
        return 1
        
    return 0

if __name__ == "__main__":
    sys.exit(main())

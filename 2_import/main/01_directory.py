#!/usr/bin/env python

from __future__ import print_function
import os, sys
import requests
import argparse
import json
import ijson
from elasticsearch import Elasticsearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from utils import Utils
from files_and_paths import Dirs, Tools, Genome, Datasets

def parseargs():
    parser = argparse.ArgumentParser()
    parser.add_argument('--rootpath', type=str, default="../../data/")
    parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
    parser.add_argument('--elasticsearch_port', type=int, default=9200)
    parser.add_argument("--debug", action="store_true", default=False)
    return parser.parse_args()

def main():
    args = parseargs()
    es = Elasticsearch([args.elasticsearch_server],
                       port = args.elasticsearch_port)

    fn = 'test-registry-human.json'
    d = os.path.join(Dirs.encyclopedia, "Version-4")
    fnp = os.path.join(d, fn)

    with open(fnp) as f:
        for idx, doc in enumerate(ijson.items(f, "item")):
            try:
                res = es.index(index="regulatory_elements2", doc_type="element", body=doc)

                if args.debug:
                    print("index succeeded for %s: HTTP response content was:\n%s" % (fnp, res))
                else:
                    if 0 == idx % 1000:
                        print(idx)
            except:
                print("error indexing file %s; check that the file's JSON is valid and elasticsearch is running" % fnp)
                if args.debug:
                    e = sys.exc_info()[:2]
                    print(e[0])
                    if hasattr(e, "message"):
                        print(e.message)
                    raise
    return 0

if __name__ == "__main__":
    sys.exit(main())

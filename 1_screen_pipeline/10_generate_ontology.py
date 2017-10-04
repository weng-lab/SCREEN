#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO
import math
from importlib import import_module

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from exp import Exp
from utils import Utils, printt, printWroteNumLines, cat
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs

class BuildOntology:
    def __init__(self, assembly):
        self.assembly = assembly

    def run(self):
        mod = import_module("10_generate_ontology")
        runF = getattr(mod, "run")

        # from https://github.com/ENCODE-DCC/encoded/blob/0c740649bad8fd15ec32e4a92e869fb59ed2ab6c/src/encoded/docs/updating_ontologies.md
        uberon_url = "http://ontologies.berkeleybop.org/uberon/composite-metazoan.owl"
        efo_url = "http://sourceforge.net/p/efo/code/HEAD/tree/trunk/src/efoinowl/InferredEFOOWLview/EFO_inferred.owl?format=raw"
        obi_url = "http://purl.obolibrary.org/obo/obi.owl"

        printt("running ENCODE DCC generate ontology...")
        terms = runF(uberon_url, efo_url, obi_url)

        fnp = paths.path(self.assembly, "ontology", "ontology.json")
        printt("done; about to write", fnp)
        with open(fnp, 'w') as f:
            json.dump(terms, f)
        printt("done")
            
def run(args, DBCONN):
    assemblies = ["hg19"] #Config.assemblies

    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        if "hg19" != assembly:
            print("skipping...")
            continue
        printt('***********', assembly)
        ig = BuildOntology(assembly)
        ig.run()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    run(args, None)
        
if __name__ == '__main__':
    main()

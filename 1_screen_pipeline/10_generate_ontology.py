#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import json
import psycopg2
import argparse
import StringIO
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
        mod = import_module("10_generate_ontology_actual")
        runF = getattr(mod, "run")

        downloadDate = '2017-10Oct-25'
        if 1:
            uberon_url = "http://ontologies.berkeleybop.org/uberon/composite-metazoan.owl"
            efo_url = "http://sourceforge.net/p/efo/code/HEAD/tree/trunk/src/efoinowl/InferredEFOOWLview/EFO_inferred.owl?format=raw"
            obi_url = "http://purl.obolibrary.org/obo/obi.owl"
        else:
            uberon_url = paths.path("ontology", downloadDate, "composite-metazoan.owl")
            efo_url = paths.path("ontology", downloadDate, "EFO_inferred.owl")
            obi_url = paths.path("ontology", downloadDate, "obi.owl")

        printt("running ENCODE DCC generate ontology...")
        terms = runF(uberon_url, efo_url, obi_url)

        fnp = paths.path("ontology", downloadDate, "ontology.json")
        Utils.ensureDir(fnp)
        printt("done; about to write", fnp)
        with open(fnp, 'w') as f:
            json.dump(terms, f)
        printWroteNumLines(fnp)


def run(args, DBCONN):
    assemblies = ["hg19"]  # Config.assemblies

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

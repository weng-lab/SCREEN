#!/usr/bin/env python

import os, sys, argparse

import importlib
LoadCellTypes = importlib.import_module('10_cellTypes')

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from bulk_es_import import executable_importer
from constants import paths, chroms

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--version', type=int, default=6)
    parser.add_argument("--fnp", type=str, default="")
    parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
    parser.add_argument('--elasticsearch_port', type=int, default=9200)
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--assembly', type=str, default="hg19")
    return parser.parse_args()

def main():
    args = parse_args()

    print("importing", args.version)
    re_json = paths.re_json_vers[args.version]

    fnps = paths.get_paths(args.version, chroms[args.assembly])
    if args.fnp:
        fnps["rewriteFnp"] = args.fnp
        
    importer = executable_importer(fnps["rewriteFnp"], fnps["index"], "element",
                                   args.elasticsearch_server,
                                   args.elasticsearch_port)
    importer.exe(500)

    LoadCellTypes.LoadCellTypes.Run(args)

if __name__ == "__main__":
    sys.exit(main())

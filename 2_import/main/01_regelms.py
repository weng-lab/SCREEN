#!/usr/bin/env python

import os, sys, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from bulk_es_import import executable_importer
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--version', type=int, default=2)
    parser.add_argument("--fnp", type=str, default="")
    parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
    parser.add_argument('--elasticsearch_port', type=int, default=9200)
    return parser.parse_args()

def main():
    args = parse_args()

    print("importing", args.version)
    re_json = paths.re_json_vers[args.version]

    fnp = re_json["rewriteFnp"]
    if args.fnp:
        fnp = args.fnp
        
    importer = executable_importer(fnp, re_json["index"], "element",
                                   args.elasticsearch_server,
                                   args.elasticsearch_port)
    importer.exe()

if __name__ == "__main__":
    sys.exit(main())

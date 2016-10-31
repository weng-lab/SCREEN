#!/usr/bin/env python

from __future__ import print_function
import sys, os, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from load_cell_types import LoadCellTypes
from bulk_es_import import executable_importer

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
    parser.add_argument('--elasticsearch_port', type=int, default=9200)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()
    LoadCellTypes.Import(args)
    importer = executable_importer(os.path.join(os.path.dirname(__file__), "../../celltypes.lsj"),
                                   "cell_types", "cell_type",
                                   args.elasticsearch_server,
                                   args.elasticsearch_port)
    importer.exe()
    return 0

if __name__ == '__main__':
    sys.exit(main())

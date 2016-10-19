#!/usr/bin/env python

from __future__ import print_function

import sys, os, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from load_cell_types import LoadCellTypes

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    LoadCellTypes.Import(args)

if __name__ == '__main__':
    main()

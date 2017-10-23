#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import ujson as json
import argparse
import fileinput
import StringIO
import gzip
import random

from joblib import Parallel, delayed

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from utils import AddPath, Utils, Timer, printt, printWroteNumLines
from cache_memcache import MemCacheWrapper
from querydcc import QueryDCC
from metadataws import MetadataWS
from files_and_paths import Datasets, Dirs
from exp import Exp

AddPath(__file__, '../common/')
from constants import paths, chroms
from common import printr, printt
from config import Config

mc = MemCacheWrapper()
qd = QueryDCC(cache=mc)

class ExtractRNAseq:
    def __init__(self, assembly):
        self.assembly = assembly

    def run(self):
        url = "https://www.encodeproject.org/search/?"
        url += "searchTerm=rna-seq&type=Experiment&assay_title=total+RNA-seq"
        url += "&assembly=" + self.assembly + "&files.file_type=tsv"
        url += "&award.project=ENCODE&award.project=Roadmap"
        url += "&format=json&limit=all"

        counter = 0
        for exp in qd.getExps(url):
            for f in exp.files:
                if not f.isTSV():
                    continue
                if f.assembly != self.assembly:
                    continue
                counter += 1
                f.download()
                print(counter, exp.encodeID, f.fileID, f.biological_replicates, f.output_type)

def run(args):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        rs = ExtractRNAseq(assembly)
        rs.run()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    return run(args)

if __name__ == '__main__':
    main()

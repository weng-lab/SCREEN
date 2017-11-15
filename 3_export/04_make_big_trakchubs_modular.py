#!/usr/bin/python

from __future__ import print_function

import sys
import json
import os
import re
import argparse
from collections import OrderedDict, defaultdict

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from files_and_paths import Dirs
from utils import Utils, eprint, AddPath, printt, printWroteNumLines
from metadataws import MetadataWS
from querydcc import QueryDCC
from cache_diskcache import DiskCacheWrapper

AddPath(__file__, '../common')
from constants import paths
from config import Config

mc = DiskCacheWrapper()
qd = QueryDCC(auth=False, cache=mc)
mw = MetadataWS(cache=mc, host="http://192.168.1.46:9008/metadata")

AssayColors = {"DNase": ["6,218,147", "#06DA93"],
               "RNA-seq": ["0,170,0", "", "#00aa00"],
               "RAMPAGE": ["214,66,202", "#D642CA"],
               "H3K4me1": ["255,223,0", "#FFDF00"],
               "H3K4me2": ["255,255,128", "#FFFF80"],
               "H3K4me3": ["255,0,0", "#FF0000"],
               "H3K9ac": ["255,121,3", "#FF7903"],
               "H3K27ac": ["255,205,0", "#FFCD00"],
               "H3K27me3": ["174,175,174", "#AEAFAE"],
               "H3K36me3": ["0,128,0", "#008000"],
               "H3K9me3": ["180,221,228", "#B4DDE4"],
               "Conservation": ["153,153,153", "#999999"],
               "TF ChIP-seq": ["18,98,235", "#1262EB"],
               "CTCF": ["0,176,240", "#00B0F0"]}


class TrackhubDb:
    def __init__(self, assembly, DBCONN, cache):
        self.assembly = assembly
        self.DBCONN = DBCONN
        self.cache = cache
        self.byBiosampleTypeBiosample = defaultdict(lambda: defaultdict(dict))
        
    def run(self):
        printt("loading exps by biosample_type...")
        byBiosampleTypeBiosample = MetadataWS.encodeByBiosampleType(self.assembly)
        for r in byBiosampleTypeBiosample:
            biosample_type = r[0]["biosample_type"]
            biosample_term_name = r[0]["biosample_term_name"]
            expIDs = r[0]["expIDs"]
            self.byBiosampleTypeBiosample[biosample_type][biosample_term_name] = mw.exps(expIDs)
        printt("done")

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="hg19")
    return parser.parse_args()


def main():
    args = parse_args()

    AddPath(__file__, '../common/')
    from dbconnect import db_connect
    from postgres_wrapper import PostgresWrapper

    AddPath(__file__, '../api/common/')
    from pg import PGsearch
    from cached_objects import CachedObjects
    from pg_common import PGcommon
    from db_trackhub import DbTrackhub
    from cached_objects import CachedObjectsWrapper

    printt("connecting to DB...")
    DBCONN = db_connect(os.path.realpath(__file__))

    printt("loading cache...")        
    ps = PostgresWrapper(DBCONN)
    cacheW = CachedObjectsWrapper(ps)

    for assembly in ["hg19", "mm10"]:
        printt("************************", assembly)
        tdb = TrackhubDb(assembly, DBCONN, cacheW[assembly])
        tdb.run()


if __name__ == '__main__':
    main()

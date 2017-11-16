#!/usr/bin/env python2

from __future__ import print_function

import sys
import json
import os
import re
import argparse
from collections import OrderedDict, defaultdict
from joblib import Parallel, delayed

from tracks import Tracks

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from files_and_paths import Dirs
from utils import Utils, eprint, AddPath, printt, printWroteNumLines
from metadataws import MetadataWS
from cache_memcache import MemCacheWrapper

AddPath(__file__, '../common')
from constants import paths
from config import Config

# from http://stackoverflow.com/a/19861595
import copy_reg
import types

def _reduce_method(meth):
    return (getattr, (meth.__self__, meth.__func__.__name__))
copy_reg.pickle(types.MethodType, _reduce_method)

mc = MemCacheWrapper(Config.memcache)

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

def output(assembly, biosample_type, biosample_term_name, expIDs, idx, total):
    mw = MetadataWS(host="http://192.168.1.46:9008/metadata")
    exps = mw.exps(expIDs)

    #print(biosample_type, biosample_term_name, len(exps))

    tracks = Tracks(assembly)
    for exp in exps:
        if exp.isHiC():
            continue
        tracks.addExpBestBigWig(exp)

    bt = biosample_type.replace(' ', '_')
    btid = re.sub('[^0-9a-zA-Z]+', '-', biosample_term_name)
    fnp = os.path.join('/home/mjp/public_html/ucsc', assembly, bt, btid +'.txt')
    Utils.ensureDir(fnp)
    with open(fnp, 'w') as f:
        for line in tracks.lines():
            f.write(line + '\n')
        f.write('\n')
    printWroteNumLines(fnp, idx, 'of', total)
    return (biosample_type, biosample_term_name, fnp)

class TrackhubDb:
    def __init__(self, args, assembly):
        self.args = args
        self.assembly = assembly
        #self.DBCONN = DBCONN
        #self.cache = cache
        self.byBiosampleTypeBiosample = defaultdict(lambda: defaultdict(dict))

    def run(self):
        printt("loading exps by biosample_type...")
        mw = MetadataWS(host="http://192.168.1.46:9008/metadata")
        byBiosampleTypeBiosample = mw.encodeByBiosampleTypeWithBigWig(self.assembly)

        jobs = []
        for r in byBiosampleTypeBiosample:
            biosample_type = r[0]["biosample_type"]
            biosample_term_name = r[0]["biosample_term_name"]
            expIDs = r[0]["expIDs"]
            jobs.append({"biosample_type": biosample_type,
                         "biosample_term_name": biosample_term_name,
                         "expIDs": expIDs,
                         "idx": len(jobs) + 1,
                         "total": len(byBiosampleTypeBiosample),
                         "assembly": self.assembly
            })

        ret = Parallel(n_jobs=self.args.j)(delayed(output)(**job) for job in jobs)

        for r in ret:
            self.byBiosampleTypeBiosample[r[0]][r[1]] = r[2]
        printt("done")
                
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=4)
    parser.add_argument("--assembly", type=str, default="hg19")
    return parser.parse_args()


def main():
    args = parse_args()

    # AddPath(__file__, '../common/')
    # from dbconnect import db_connect
    # from postgres_wrapper import PostgresWrapper

    # AddPath(__file__, '../api/common/')
    # from pg import PGsearch
    # from cached_objects import CachedObjects
    # from pg_common import PGcommon
    # from db_trackhub import DbTrackhub
    # from cached_objects import CachedObjectsWrapper

    # printt("connecting to DB...")
    # DBCONN = db_connect(os.path.realpath(__file__))

    # printt("loading cache...")        
    # ps = PostgresWrapper(DBCONN)
    # cacheW = CachedObjectsWrapper(ps)

    for assembly in ["hg19", "mm10"]:
        printt("************************", assembly)
        tdb = TrackhubDb(args, assembly)
        tdb.run()


if __name__ == '__main__':
    main()

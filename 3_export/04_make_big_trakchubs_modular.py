#!/usr/bin/env python2

from __future__ import print_function

import sys
import json
import os
import argparse
from collections import OrderedDict, defaultdict
from joblib import Parallel, delayed

from tracks import Tracks
import helpers as Helpers

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

BaseDir = '/home/mjp/public_html/ucsc'

class TrackhubDb:
    def __init__(self, args, assembly):
        self.args = args
        self.assembly = assembly
        #self.DBCONN = DBCONN
        #self.cache = cache
        self.byBiosampleTypeBiosample = defaultdict(lambda: defaultdict(dict))
        self.subGroups = defaultdict(lambda: defaultdict(lambda: defaultdict(set)))
        
    def runJobs(self):
        printt("loading exps by biosample_type...")
        mw = MetadataWS(host="http://192.168.1.46:9008/metadata")
        byBiosampleTypeBiosample = mw.encodeByBiosampleTypeCustom(self.assembly)

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

        for bSgs in ret:
            bt, btn, sgs = bSgs
            for k, v in sgs.iteritems():
                self.subGroups[bt][btn][k].update(v)

    def run(self):
        self.runJobs()
        self._makeFiles()
        
    def _makeFiles(self):
        btToNormal = {}
        btnToNormal = {}
        mw = MetadataWS(host="http://192.168.1.46:9008/metadata")
        byBiosampleTypeBiosample = mw.encodeByBiosampleTypeCustom(self.assembly)
        for r in byBiosampleTypeBiosample:
            biosample_type = r[0]["biosample_type"]
            biosample_term_name = r[0]["biosample_term_name"]
            expIDs = r[0]["expIDs"]
            bt = Helpers.sanitize(biosample_type)
            btToNormal[bt] = biosample_type
            btn = Helpers.sanitize(biosample_term_name)
            btnToNormal[btn] = biosample_term_name
            fnp = os.path.join("subtracks", bt, btn +'.txt')
            self.byBiosampleTypeBiosample[bt][btn]= {"fnp": fnp,
                                                     "numExps": len(expIDs)}

        mainTrackDb = ''

        for bt, btnFnps in self.byBiosampleTypeBiosample.iteritems():
            totalExperiments = sum([info["numExps"] for info in btnFnps.values()])
            longLabel = btToNormal[bt] + " (%s experiments)" % totalExperiments
            mainTrackDb += """
track super_{bt}
superTrack on
shortLabel {shortL}
longLabel {longL}

""".format(bt = bt,
           shortL=Helpers.makeShortLabel(btToNormal[bt]),
           longL=Helpers.makeLongLabel(longLabel))
            
            for btn, info in btnFnps.iteritems():
                fn = os.path.join("tracks", bt + '_' + btn + '.txt')
                fnp = os.path.join(BaseDir, self.assembly, fn)
                Utils.ensureDir(fnp)
                mainTrackDb += 'include ' + fn + '\n';
                printt("makefiles: writing", fnp)

                subGroups = self.subGroups[bt][btn]
                donors = {a[0]:a[1] for a in subGroups["donor"]}
                ages =  {a[0]:a[1] for a in subGroups["age"]}

                longLabel = btnToNormal[btn] + " (%s experiments)" % info["numExps"]
                
                with open(fnp, 'w') as f:
                    f.write("""
track {bt}_{btn}
parent super_{bt}
compositeTrack on
shortLabel {shortL}
longLabel {longL}
type bigWig 9 +
maxHeightPixels 64:12:8
autoScale on
subGroup1 donor Donor {donors}
subGroup2 age Age {ages}
sortOrder donor=+ age=+
dimensions dimX=age dimY=donor
dragAndDrop subTracks
hoverMetadata on
darkerLabels on
""".format(bt=bt,
           btn=btn,
           shortL=Helpers.makeShortLabel(btnToNormal[btn]),
           longL=Helpers.makeLongLabel(longLabel),
           donors=Helpers.unrollEquals(donors),
           ages=Helpers.unrollEquals(ages)))
        print("done", fnp)

        fnp = os.path.join(BaseDir, self.assembly, 'subtracks.txt')
        mainTrackDb += 'include ' + 'subtracks.txt'
        printt("makefiles: writing", fnp)
        with open(fnp, 'w') as f:
            for bt, btnFnps in self.byBiosampleTypeBiosample.iteritems():
                for btn, info in btnFnps.iteritems():
                        f.write('include ' + info["fnp"] + '\n')
        print("done", fnp)

        fnp = os.path.join(BaseDir, self.assembly, 'trackDb.txt')
        printt("makefiles: writing", fnp)
        with open(fnp, 'w') as f:
            f.write(mainTrackDb)
        print("done", fnp)

def output(assembly, biosample_type, biosample_term_name, expIDs, idx, total):
    mw = MetadataWS(host="http://192.168.1.46:9008/metadata")
    exps = mw.exps(expIDs)

    #print(biosample_type, biosample_term_name, len(exps))
    bt = Helpers.sanitize(biosample_type)
    btn = Helpers.sanitize(biosample_term_name)

    parent = bt + '_' + btn
    
    tracks = Tracks(assembly, parent)
    for exp in exps:
        tracks.addExpBestBigWig(exp)

    fnp = os.path.join(BaseDir, assembly, "subtracks", bt, btn +'.txt')
    Utils.ensureDir(fnp)
    with open(fnp, 'w') as f:
        for line in tracks.lines():
            f.write(line)
    printWroteNumLines(fnp, idx, 'of', total)
    return [bt, btn, tracks.subgroups()]
                
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

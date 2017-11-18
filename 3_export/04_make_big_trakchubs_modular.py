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
Host = "http://192.168.1.46:9008/metadata"
BaseDir = '/home/mjp/public_html/ucsc'

class TrackhubDb:
    def __init__(self, args, assembly):
        self.args = args
        self.assembly = assembly
        self.byBiosampleTypeBiosample = defaultdict(lambda: defaultdict(dict))
        self.subGroups = defaultdict(lambda: defaultdict(lambda: defaultdict(set)))

        printt("loading exps by biosample_type...")
        mw = MetadataWS(host=Host)
        self.inputData = mw.encodeByBiosampleTypeCustom(self.assembly)

    def _makeSubTracks(self):
        jobs = []
        for bt, btnInfo in self.byBiosampleTypeBiosample.iteritems():
            for btn, info in btnInfo.iteritems():
                jobs.append({"bt": bt,
                             "btn": btn,
                             "expIDs": info["expIDs"],
                             "fnpBase": info["fnpBase"],
                             "idx": len(jobs) + 1,
                             "total": len(self.inputData),
                             "assembly": self.assembly
            })

        ret = Parallel(n_jobs=self.args.j)(delayed(outputSubTrack)(**job) for job in jobs)

        for bSgs in ret:
            bt, btn, sgs = bSgs
            for k, v in sgs.iteritems():
                self.subGroups[bt][btn][k].update(v)

    def run(self):
        self.btToNormal = {}
        self.btnToNormal = {}
        for r in self.inputData:
            biosample_type = r[0]["biosample_type"]
            bt = Helpers.sanitize(biosample_type)
            self.btToNormal[bt] = biosample_type

            biosample_term_name = r[0]["biosample_term_name"]
            btn = Helpers.sanitize(biosample_term_name)
            self.btnToNormal[btn] = biosample_term_name

            expIDs = r[0]["expIDs"]
            fnpBase = os.path.join("subtracks", bt, btn +'.txt')
            self.byBiosampleTypeBiosample[bt][btn]= {"fnpBase": fnpBase,
                                                     "expIDs": expIDs,
                                                     "numExps": len(expIDs)}

        self._makeSubTracks()
        self._makeFiles()
        self._makeHub()
        
    def _makeFiles(self):
        mainTrackDb = ''

        for bt, btnFnps in self.byBiosampleTypeBiosample.iteritems():
            totalExperiments = sum([info["numExps"] for info in btnFnps.values()])
            longLabel = self.btToNormal[bt] + " (%s experiments)" % totalExperiments
            mainTrackDb += """
track super_{bt}
superTrack on
shortLabel {shortL}
longLabel {longL}

""".format(bt = bt,
           shortL=Helpers.makeShortLabel(self.btToNormal[bt]),
           longL=Helpers.makeLongLabel(longLabel))
            
            for btn, info in btnFnps.iteritems():
                fn = os.path.join("composite_tracks", bt, btn + '.txt')
                fnp = os.path.join(BaseDir, self.assembly, fn)
                Utils.ensureDir(fnp)
                mainTrackDb += 'include ' + fn + '\n';

                subGroups = self.subGroups[bt][btn]
                subGroupsDict = {}
                for k in Helpers.SubGroupKeys:
                    subGroupsDict[k] = {a[0]:a[1] for a in subGroups[k]}
                longLabel = self.btnToNormal[btn] + " (%s experiments)" % info["numExps"]

                if "immortalized_cell_line" == bt:
                    subGroup1key = "label"
                    subGroup2key = "assay"
                else:
                    subGroup1key = "donor"
                    subGroup2key = "age"
                subGroup1 = Helpers.unrollEquals(subGroupsDict[subGroup1key])
                subGroup2 = Helpers.unrollEquals(subGroupsDict[subGroup2key])
                
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
subGroup1 {subGroup1key} {subGroup1key} {subGroup1}
subGroup2 {subGroup2key} {subGroup2key} {subGroup2}
sortOrder {subGroup1key}=+ {subGroup2key}=+
dimensions dimX={subGroup2key} dimY={subGroup1key}
dragAndDrop subTracks
hoverMetadata on
darkerLabels on
""".format(bt=bt,
           btn=btn,
           shortL=Helpers.makeShortLabel(self.btnToNormal[btn]),
           longL=Helpers.makeLongLabel(longLabel),
           subGroup1key=subGroup1key,
           subGroup1=subGroup1,
           subGroup2key=subGroup2key,
           subGroup2=subGroup2))
        printWroteNumLines(fnp)

        fnp = os.path.join(BaseDir, self.assembly, 'subtracks.txt')
        mainTrackDb += 'include ' + 'subtracks.txt'
        with open(fnp, 'w') as f:
            for bt, btnFnps in self.byBiosampleTypeBiosample.iteritems():
                for btn, info in btnFnps.iteritems():
                        f.write('include ' + info["fnpBase"] + '\n')
        printWroteNumLines(fnp)

        fnp = os.path.join(BaseDir, self.assembly, 'trackDb.txt')
        with open(fnp, 'w') as f:
            f.write(mainTrackDb)
        printWroteNumLines(fnp)

    def _makeHub(self):
        fnp = os.path.join(BaseDir, 'hub.txt')
        with open(fnp, 'w') as f:
            f.write("""
hub ENCODE
shortLabel ENCODE Trackhub Test3
longLabel ENCODE Trackhub Test3
genomesFile genomes.txt
email zhiping.weng@umassmed.edu
descriptionUrl http://encodeproject.org/
""")
        printWroteNumLines(fnp)
        
def outputSubTrack(assembly, bt, btn, expIDs, fnpBase, idx, total):
    mw = MetadataWS(host=Host)
    exps = mw.exps(expIDs)

    parent = bt + '_' + btn
    
    tracks = Tracks(assembly, parent)
    for exp in exps:
        tracks.addExpBestBigWig(exp)

    fnp = os.path.join(BaseDir, assembly, fnpBase)
    Utils.ensureDir(fnp)
    with open(fnp, 'w') as f:
        for line in tracks.lines():
            f.write(line)
    printWroteNumLines(fnp, idx, 'of', total)
    return [bt, btn, tracks.subgroups()]

def outputGenomes(assemblies):
    fnp = os.path.join(BaseDir, 'genomes.txt')
    with open(fnp, 'w') as f:
        for assembly in assemblies:
            f.write("""
genome {assembly}
trackDb {assembly}/trackDb.txt
""".format(assembly = assembly))
    printWroteNumLines(fnp)
    

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

    assemblies = ["hg19", "mm10"]
    for assembly in assemblies:
        printt("************************", assembly)
        tdb = TrackhubDb(args, assembly)
        tdb.run()
    outputGenomes(assemblies)

if __name__ == '__main__':
    main()

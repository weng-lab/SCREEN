#!/usr/bin/env python2

from __future__ import print_function

import sys
import json
import os
import argparse
from collections import OrderedDict, defaultdict
from joblib import Parallel, delayed

from tracks import Tracks, Parent
import helpers as Helpers

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from files_and_paths import Dirs
from utils import Utils, eprint, AddPath, printt, printWroteNumLines
from metadataws import MetadataWS

AddPath(__file__, '../common')
from constants import paths
from config import Config

# from http://stackoverflow.com/a/19861595
import copy_reg
import types

def _reduce_method(meth):
    return (getattr, (meth.__self__, meth.__func__.__name__))
copy_reg.pickle(types.MethodType, _reduce_method)

def merge_two_dicts(x, y):
    z = x.copy()   # start with x's keys and values
    z.update(y)    # modifies z with y's keys and values & returns None
    return z

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
                jobs.append(merge_two_dicts(info,
                                            {
                                                "idx": len(jobs) + 1,
                                                "total": len(self.inputData)}))
                
        self.compositeTrack  = Parallel(n_jobs=self.args.j)(delayed(outputAllTracks)(job)
                                                            for job in jobs)

    def run(self):
        printt("building infos...")
        btToNormal = {}
        for r in self.inputData:
            biosample_type = r[0]["biosample_type"]
            bt = Helpers.sanitize(biosample_type)
            btToNormal[bt] = biosample_type
            
            biosample_term_name = r[0]["biosample_term_name"]
            btn = Helpers.sanitize(biosample_term_name)

            expIDs = r[0]["expIDs"]
            fnpBase = os.path.join("subtracks", bt, btn +'.txt')
            self.byBiosampleTypeBiosample[bt][btn]= {
                "biosample_type": biosample_type,
                "bt": bt,
                "biosample_term_name": biosample_term_name,
                "btn": btn,
                "fnpBase": fnpBase,
                "expIDs": expIDs,
                "assembly": self.assembly
            }

        printt("making tracks and subtracks...")
        self._makeSubTracks()
        self._makeFiles(btToNormal)
        self._makeHub()
        
    def _makeFiles(self, btToNormal):
        mainTrackDb = []

        for bt, btnFnps in self.byBiosampleTypeBiosample.iteritems():
            totalExperiments = sum([len(info["expIDs"]) for info in btnFnps.values()])
            shortLabel = btToNormal[bt]
            longLabel = btToNormal[bt] + " (%s experiments)" % totalExperiments
            mainTrackDb.append("""
track super_{bt}
superTrack on
shortLabel {shortL}
longLabel {longL}
""".format(bt = bt,
           shortL=Helpers.makeShortLabel(shortLabel),
           longL=Helpers.makeLongLabel(longLabel)))

        fnp = os.path.join(BaseDir, self.assembly, 'composite_tracks.txt')
        mainTrackDb.append('include composite_tracks.txt')
        with open(fnp, 'w') as f:
            for t in self.compositeTrack:
                f.write(t)
        printWroteNumLines(fnp)
                
        fnp = os.path.join(BaseDir, self.assembly, 'subtracks.txt')
        mainTrackDb.append('include subtracks.txt')
        with open(fnp, 'w') as f:
            for bt, btnFnps in self.byBiosampleTypeBiosample.iteritems():
                for btn, info in btnFnps.iteritems():
                        f.write('include ' + info["fnpBase"] + '\n')
        printWroteNumLines(fnp)

        fnp = os.path.join(BaseDir, self.assembly, 'trackDb.txt')
        with open(fnp, 'w') as f:
            f.write('\n'.join(mainTrackDb))
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

def outputAllTracks(info):
    subGroups = outputSubTrack(**info)
    info["subGroups"] = subGroups
    return outputCompositeTrack(**info)

def outputCompositeTrack(assembly, bt, btn, expIDs, fnpBase, idx, total, subGroups,
                         biosample_type, biosample_term_name):
    fn = os.path.join("composite_tracks", bt, btn + '.txt')
    fnp = os.path.join(BaseDir, assembly, fn)
    Utils.ensureDir(fnp)

    subGroupsDict = {}
    for k in Helpers.SubGroupKeys:
        subGroupsDict[k] = {a[0]:a[1] for a in subGroups[k]}
    longLabel = biosample_term_name + " (%s experiments)" % len(expIDs)

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
           shortL=Helpers.makeShortLabel(biosample_term_name),
           longL=Helpers.makeLongLabel(longLabel),
           subGroup1key=subGroup1key,
           subGroup1=subGroup1,
           subGroup2key=subGroup2key,
           subGroup2=subGroup2))
    printWroteNumLines(fnp, idx, 'of', total)
    return 'include ' + fn + '\n' # for listing in trackDb....

def outputSubTrack(assembly, bt, btn, expIDs, fnpBase, idx, total,
                   biosample_type, biosample_term_name):
    mw = MetadataWS(host=Host)
    exps = mw.exps(expIDs)

    parent = Parent(bt + '_' + btn, False)
    
    tracks = Tracks(assembly, parent)
    for exp in exps:
        tracks.addExpBestBigWig(exp)

    fnp = os.path.join(BaseDir, assembly, fnpBase)
    Utils.ensureDir(fnp)
    with open(fnp, 'w') as f:
        for line in tracks.lines():
            f.write(line)
    printWroteNumLines(fnp, idx, 'of', total)
    return tracks.subgroups()

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

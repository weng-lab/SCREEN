#!/usr/bin/env python2

from __future__ import print_function

import sys
import json
import os
import re
import argparse
import requests
from collections import OrderedDict, defaultdict
from joblib import Parallel, delayed

from tracks import Tracks, Parent
import helpers as Helpers

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from files_and_paths import Dirs
from utils import Utils, eprint, AddPath, printt, printWroteNumLines
from metadataws import MetadataWS
from files_and_paths import Urls

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

Host = Urls.metadataWebService #"http://192.168.1.46:9008/metadata"
BaseDir = '/home/mjp/public_html/ucsc'


class Lookup:
    def __init__(self, btid, btname, info, cREs):
        self.btid = btid
        self.btname = btname
        self.info = info
        self.cREs = cREs

    def isActive(self):
        r = self.btid in ["hepatocyte_derived_from_H9",
                          "bipolar_spindle_neuron_derived_from_induced_pluripotent_stem_cell",
                          "B_cell_adult"]
        # if r:
        #    print("active biosample:", self.btid)
        return r

class TrackhubDb:
    def __init__(self, args, assembly, cache):
        self.args = args
        self.assembly = assembly
        self.cache = cache
        self.byBiosampleTypeBiosample = defaultdict(lambda: defaultdict(dict))
        self.subGroups = defaultdict(lambda: defaultdict(lambda: defaultdict(set)))

        printt("loading exps by biosample_type...")
        self.mw = MetadataWS(host=Host)
        self.inputData = self.mw.encodeByBiosampleTypeCustom(self.assembly)
        self.lookupByExp = {}

    def _makeSubTracks(self):
        jobs = []
        for bt, btnInfo in self.byBiosampleTypeBiosample.iteritems():
            for btn, info in btnInfo.iteritems():
                jobs.append(merge_two_dicts(info,
                                            {"lookupByExp": self.lookupByExp,
                                             "idx": len(jobs) + 1,
                                             "total": len(self.inputData)}))

        Parallel(n_jobs=self.args.j)(delayed(outputAllTracks)(job)
                                     for job in jobs)

    def _lookup(self):
        fnp = paths.path(self.assembly, self.assembly + "-Look-Up-Matrix.txt")
        printt("parsing", fnp)

        creBigBeds = self.cache["creBigBedsByCellType"]

        self.lookupByExp = {}
        for ct, assays in self.cache["byCellType"].iteritems():
            for info in assays:
                btid = info["cellTypeName"]
                btname = info["cellTypeDesc"]
                expID = info["expID"]
                cREs = creBigBeds.get(btid, {})
                if not cREs:
                    print("missing cREs for", btid)
                self.lookupByExp[expID] = Lookup(btid, btname, info, cREs)
        print(len(self.lookupByExp))

    def run(self):
        printt("building lookup...")
        self._lookup()

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
superTrack on show
shortLabel {shortL}
longLabel {longL}
""".format(bt = bt,
           shortL=Helpers.makeShortLabel(shortLabel),
           longL=Helpers.makeLongLabel(longLabel)))

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
    outputCompositeTrack(**info)

def outputCompositeTrack(assembly, bt, btn, expIDs, fnpBase, idx, total, subGroups,
                         biosample_type, biosample_term_name, lookupByExp):
    fnp = os.path.join(BaseDir, assembly, fnpBase)
    if not os.path.exists(fnp):
        raise Exception("missing " + fnp)

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
    subGroup3key = "view"
    subGroup1 = Helpers.unrollEquals(subGroupsDict[subGroup1key])
    subGroup2 = Helpers.unrollEquals(subGroupsDict[subGroup2key])
    subGroup3 = Helpers.unrollEquals(subGroupsDict[subGroup3key])

    actives = []
    for expID in expIDs:
        if expID in lookupByExp:
            actives.append(lookupByExp[expID].isActive())
    isActive = any(t for t in actives)
    if isActive:
        print("active biosample (composite):", btn)

    with open(fnp) as f:
        subtracks = f.read()

    with open(fnp, 'w') as f:
        f.write("""
track {bt}_{btn}
parent super_{bt}
compositeTrack on
""".format(bt=bt,
           btn=btn))
        if isActive:
            f.write("visibility full\n")
        f.write("""shortLabel {shortL}
longLabel {longL}
type bigWig 9 +
maxHeightPixels 64:12:8
autoScale on
subGroup1 {subGroup1key} {subGroup1key} {subGroup1}
subGroup2 {subGroup2key} {subGroup2key} {subGroup2}
subGroup3 {subGroup3key} {subGroup3key} {subGroup3}
sortOrder {subGroup1key}=+ {subGroup2key}=+ {subGroup3key}=+
dimensions dimX={subGroup2key} dimY={subGroup1key}
dragAndDrop subTracks
hoverMetadata on
darkerLabels on
""".format(shortL=Helpers.makeShortLabel(biosample_term_name),
           longL=Helpers.makeLongLabel(longLabel),
           subGroup1key=subGroup1key,
           subGroup1=subGroup1,
           subGroup2key=subGroup2key,
           subGroup2=subGroup2,
           subGroup3key=subGroup3key,
           subGroup3=subGroup3
))
        f.write('\n' + subtracks)

    printWroteNumLines(fnp, idx, 'of', total)

def outputSubTrack(assembly, bt, btn, expIDs, fnpBase, idx, total,
                   biosample_type, biosample_term_name, lookupByExp):
    mw = MetadataWS(host=Host)
    exps = mw.exps(expIDs)

    actives = []
    for expID in expIDs:
        if expID in lookupByExp:
            actives.append(lookupByExp[expID].isActive())
    isActive = any(t for t in actives)
    if isActive:
        print("active biosample:", btn)

    parent = Parent(bt + '_' + btn, isActive)

    tracks = Tracks(assembly, parent, (1 + idx) * 1000)
    for exp in exps:
        active = False
        expID = exp.encodeID
        cREs = {}
        if expID in lookupByExp:
            active = lookupByExp[expID].isActive()
            cREs = lookupByExp[expID].cREs
        tracks.addExp(exp, active, cREs)

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

    assemblies = ["hg19", "mm10"]
    for assembly in assemblies:
        printt("************************", assembly)

        printt("loading cache from API...")
        cacheUrl = "http://api.wenglab.org/screenv10_python/globalData/0/" + assembly
        ws = requests.get(cacheUrl)
        cache = ws.json()
        printt("done")

        tdb = TrackhubDb(args, assembly, cache)
        tdb.run()
    outputGenomes(assemblies)

if __name__ == '__main__':
    main()

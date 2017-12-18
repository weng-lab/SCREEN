#!/usr/bin/python

import sys
import StringIO
import cherrypy
import json
import os
import heapq
import re
import argparse
from collections import OrderedDict

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs
from utils import Utils, eprint, AddPath

sys.path.append(os.path.join(os.path.dirname(__file__), '../common'))
from coord import Coord
from pg import PGsearch
from db_trackhub import DbTrackhub

import trackhub_helpers as Helpers

from helpers_trackhub import PredictionTrack

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common'))
from constants import paths
from config import Config

UCSC = 1
WASHU = 2
ENSEMBL = 3

#WWW = "http://users.wenglab.org/moorej3/cREs"
WWW = "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10"

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

AgnosticCres = {"5-group": {"hg19": "ENCFF658MYW",
                            "mm10": "ENCFF318XQA"},
                "9-state": {"H3K4me3": {"hg19": "ENCFF706MWD",
                                        "mm10": "ENCFF549SJX"},
                            "H3K27ac": {"hg19": "ENCFF656QBL",
                                        "mm10": "ENCFF776IAR"},
                            "CTCF": {"hg19": "ENCFF106AGR",
                                       "mm10": "ENCFF506YHI"}}}

def EncodeUrlBigBed(accession):
    return os.path.join("https://www.encodeproject.org/files/",
                        accession,
                        "@@download/",
                        accession + ".bigBed?proxy=true")

def EncodeUrlBigWig(accession):
    return os.path.join("https://www.encodeproject.org/files/",
                        accession,
                        "@@download/",
                        accession + ".bigWig?proxy=true")

def outputLines(d, indentLevel, extras = {}):
    prefix = '\t' * indentLevel
    for k, v in d.iteritems():
        if v:
            yield prefix + k + " " + str(v) + '\n'
    for k, v in extras.iteritems():
        if v:
            yield prefix + k + " " + str(v) + '\n'
    yield '\n'

def colorize(assay):
    c = "227,184,136"
    if assay in AssayColors:
        c = AssayColors[assay][0]
    return c

class cRETrack(object):
    def __init__(self, assembly, stateType, cREaccession, parent, active, desc):
        self.assembly = assembly
        self.stateType = stateType
        self.cREaccession = cREaccession
        self.parent = parent
        self.active = active
        self.desc = desc
        self.p = self._init()

    def _init(self):
        p = OrderedDict()
        p["track"] = Helpers.sanitize(self.cREaccession)
        p["parent"] = self.parent
        p["bigDataUrl"] = self._url()
        p["visibility"] = Helpers.viz("dense", self.active)
        p["type"] = "bigBed 9"
        p["shortLabel"] = Helpers.makeShortLabel(self.desc)
        p["longLabel"] = Helpers.makeLongLabel(self.desc)
        p["itemRgb"] = "On"
        p["darkerLabels"] = "on"
        return p

    def _url(self):
        return EncodeUrlBigBed(self.cREaccession)
    
    def lines(self, priority):
        return ''.join([x for x in outputLines(self.p, 1, {"priority": priority})])
        

class BigWigTrack(object):
    def __init__(self, assembly, expID, fileID, assay, parent, active, desc, ct):
        self.assembly = assembly
        self.expID = expID
        self.fileID = fileID
        self.assay = assay
        self.parent = parent
        self.active = active
        self.desc = desc
        self.ct = ct
        self.p = self._init()

    def _init(self):
        p = OrderedDict()
        p["track"] = Helpers.sanitize(self.expID + '_' + self.fileID)
        p["parent"] = self.parent
        p["bigDataUrl"] = self._url()
        p["visibility"] = Helpers.viz("full", self.active)
        p["type"] = "bigWig"
        p["color"] = colorize(self.assay)
        p["maxHeightPixels"] = "128:32:8"
        p["shortLabel"] = Helpers.makeShortLabel(self.assay, self.ct)
        p["longLabel"] = Helpers.makeLongLabel(self.desc)
        p["itemRgb"] = "On"
        p["darkerLabels"] = "on"
        p["autoScale"] = "off"
        p["viewLimits"] = self._signalMax()
        return p

    def _signalMax(self):
        if "DNase" == self.assay:
            return "0:150"
        return "0:50"

    def _url(self):
        return EncodeUrlBigWig(self.fileID)
    
    def lines(self, priority):
        return ''.join([x for x in outputLines(self.p, 1, {"priority": priority})])


class TrackhubDb:
    def __init__(self, ps, cacheW, db, browser):
        self.ps = ps
        self.cacheW = cacheW
        self.db = db
        self.browser = browser
        self.fileIDs = set()

    def ucsc_trackhub(self, *args, **kwargs):
        #print("ucsc **************** args:", args)
        uuid = args[0]

        try:
            info = self.db.get(uuid)
        except:
            raise
            return "error: couldn't find uuid"

        self.assembly = info["assembly"]

        if 2 == len(args):
            loc = args[1]
            if loc.startswith("hub_") and loc.endswith(".txt"):
                self.hubNum = loc.split('_')[1].split('.')[0]
                return self.makeHub()
            if loc.startswith("genomes_") and loc.endswith(".txt"):
                self.hubNum = loc.split('_')[1].split('.')[0]
                return self.makeGenomes()
            return "error with path"

        if 3 != len(args):
            return "path too long"

        loc = args[2]
        if loc.startswith("trackDb_") and loc.endswith(".txt"):
            self.hubNum = loc.split('_')[1].split('.')[0]
            return self.makeTrackDb(info["reAccession"], info["j"])
        if loc.startswith("trackDb_") and loc.endswith(".html"):
            self.hubNum = loc.split('_')[1].split('.')[0]
            return self.makeTrackDb(info["reAccession"], info["j"]).replace("\n", "<br/>")

        return "invalid path"

    def makeGenomes(self):
        return """genome\t{assembly}
trackDb\t{assembly}/trackDb_{hubNum}.txt""".format(assembly=self.assembly,
                                                   hubNum=self.hubNum)

    def makeHub(self):
        f = StringIO.StringIO()
        t = "ENCODE Candidate Regulatory Elements " + self.assembly
        if Config.ribbon:
            t += " (%s)" % Config.ribbon

        for r in [["hub", t],
                  ["shortLabel", t],
                  ["longLabel", t],
                  ["genomesFile", "genomes_{hubNum}.txt".format(hubNum=self.hubNum)],
                  ["email", "zhiping.weng@umassmed.edu"]]:
            f.write(" ".join(r) + "\n")
        return f.getvalue()

    def makeTrackDb(self, accession, j):
        lines = self.getLines(accession, j)

        f = StringIO.StringIO()
        map(lambda line: f.write(line + "\n"), lines)

        return f.getvalue()

    def getLines(self, accession, j):
        self.priority = 1

        show5group = j["showCombo"]
        self.lines = [self.generalCREs(show5group)]

        for ct in j["cellTypes"]:
            self.lines += self._add_ct(ct, show5group)

        return filter(lambda x: x, self.lines)

    def generalCREs(self, fiveGroup):
        if fiveGroup:
            url = EncodeUrlBigBed(AgnosticCres["5-group"][self.assembly])
            desc = "general cREs (5 group)"
            t = PredictionTrack(desc, self.priority, url, True).track(desc)
            self.priority += 1
        else:
            t = ""
            for stateType in ["H3K4me3", "H3K27ac", "CTCF"]:
                cREaccession = AgnosticCres["9-state"][stateType][self.assembly]
                url = EncodeUrlBigBed(cREaccession)
                desc = stateType + " 9-state cREs"
                t += PredictionTrack(desc, self.priority, url, True).track(desc)
                t += "\n\n"
                self.priority += 1
        return t

    def _add_ct(self, ct, show5group):
        cache = self.cacheW[self.assembly]

        superTrackName = Helpers.sanitize("super_" + ct)

        ret = self.makeSuperTrack(ct, superTrackName)

        #cRE biosample-specific tracks

        cREs = cache.creBigBeds[ct]
        if show5group:
            cREaccession = cREs["5group"]
            url = EncodeUrlBigBed(cREaccession)
            desc = ct + "5-group cREs"
            stateType = "5-group"
            t = cRETrack(self.assembly, stateType, cREaccession, superTrackName,
                         True, desc).lines(self.priority)
            self.priority += 1
            ret += [t]
        else:
            for stateType in ["H3K4me3", "H3K27ac", "CTCF"]:
                key = "9state-" + stateType
                if key not in cREs:
                    continue
                cREaccession = cREs[key]
                desc = ct + " 9-group " + stateType + " cREs"
                t = cRETrack(self.assembly, stateType, cREaccession, superTrackName,
                              True, desc).lines(self.priority)
                self.priority += 1
                ret += [t]

        # bigWig signal tracks
        for expInfo in cache.datasets.byCellType[ct]:
            desc = ' '.join([
                expInfo["assay"],
                "Signal in",
                ct,
                expInfo["expID"]
            ])
            t = BigWigTrack(self.assembly, expInfo["expID"], expInfo["fileID"],
                            expInfo["assay"], superTrackName, True, desc, ct).lines(self.priority)
            self.priority += 1
            ret += [t]
        
        return ret

    def makeSuperTrack(self, ct, tn):
        supershow = "on"

        return ["""
track {tn}
superTrack on show
shortLabel {tct_short}
longLabel {tct_long}
        """.format(tn=tn,
                   supershow=supershow,
                   tct_short = Helpers.makeShortLabel(ct),
                   tct_long = Helpers.makeLongLabel(ct))]


        #title = ' '.join(["cREs in", tct, "with high", a, '(9 state)'])
        #desc = ' '.join([bw, "Peaks", mt["assay_term_name"], mt["target"],


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="hg19")
    return parser.parse_args()


def main():
    args = parse_args()

    AddPath(__file__, '../../common/')
    from dbconnect import db_connect
    from postgres_wrapper import PostgresWrapper

    AddPath(__file__, '../../website/common/')
    from pg import PGsearch
    from cached_objects import CachedObjects
    from pg_common import PGcommon
    from db_trackhub import DbTrackhub
    from cached_objects import CachedObjectsWrapper

    DBCONN = db_connect(os.path.realpath(__file__))

    ps = PostgresWrapper(DBCONN)
    cacheW = CachedObjectsWrapper(ps)
    db = DbTrackhub(DBCONN)

    tdb = TrackhubDb(ps, cacheW, db, UCSC)
    for assembly in [args.assembly]:
        tdb.makeAllTracks(assembly)


if __name__ == '__main__':
    main()

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

from trackinfo import TrackInfo

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs
from utils import Utils, eprint, AddPath

sys.path.append(os.path.join(os.path.dirname(__file__), '../common'))
from coord import Coord
from pg import PGsearch
from db_trackhub import DbTrackhub
from helpers_trackhub import Track, PredictionTrack, BigGenePredTrack, BigWigTrack, officialVistaTrack, bigWigFilters, BIB5, TempWrap, BigBedTrack

import trackhub_helpers as Helpers

from cre import CRE

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

class cRETrack(object):
    def __init__(self, assembly, exp, stateType, cREaccession, parent, active):
        self.assembly = assembly
        self.exp = exp
        self.stateType = stateType
        self.cREaccession = cREaccession
        self.parent = parent
        self.active = active
        self.p = self._init()

    def _init(self):
        p = OrderedDict()
        p["track"] = Helpers.sanitize(self.exp.encodeID + '_' + self.cREaccession)
        p["parent"] = self.parent.param(self.parent.on)
        p["subGroups"] = Helpers.unrollEquals(self._subgroups())
        p["bigDataUrl"] = self._url()
        p["visibility"] = Helpers.viz("dense", self.active)
        p["type"] = "bigBed 9"
        p["shortLabel"] = Helpers.makeShortLabel(self.exp.assay_term_name, self.exp.tf)
        p["longLabel"] = Helpers.makeLongLabel(self._desc())
        p["itemRgb"] = "On"
        p["darkerLabels"] = "on"
        p["metadata"] = Helpers.unrollEquals(self._metadata())
        p["view"] = self.exp.encodeID
        return p


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

    def getLines(self, accession, j):
        self.priority = 1

        self.lines = [self.generalCREs(j["showCombo"])]

        #self._addSignalFiles(accession, j)

        return filter(lambda x: x, self.lines)

    def generalCREs(self, fiveGroup):
        if fiveGroup:
            url = EncodeUrlBigBed(AgnosticCres["5-group"][self.assembly])
            t = PredictionTrack("general cREs (5 group)",
                                self.priority, url, True).track("general cREs (5 group)")
            self.priority += 1
        else:
            t = ""
            for stateType in ["H3K4me3", "H3K27ac", "CTCF"]:
                url = EncodeUrlBigBed(AgnosticCres["9-state"][stateType][self.assembly])
                desc = stateType + " 9-state cREs"
                t += PredictionTrack(desc,
                                     self.priority, url,
                                     True).track(desc)
                t += "\n\n"
                self.priority += 1
        return t

    def trackhubExp(self, trackInfo, stname, hideAll=False):
        self.fileIDs.add(trackInfo.fileID)

        url = "https://www.encodeproject.org/files/{e}/@@download/{e}.bigWig?proxy=true".format(e=trackInfo.fileID)
        if self.browser in [WASHU, ENSEMBL]:
            url = os.path.join("http://bib7.umassmed.edu/~purcarom/bib5/annotations_demo/data/",
                               trackInfo.expID, trackInfo.fileID + ".bigWig")

        desc = trackInfo.desc()
        shortLabel = trackInfo.shortLabel()

        if self.browser in [UCSC, ENSEMBL]:
            track = BigWigTrack(desc, self.priority, url,
                                trackInfo.color(), stname,
                                trackInfo.signalMax(), hide=hideAll).track(shortLabel)
        else:
            track = BigWigTrack(desc, self.priority, url,
                                trackInfo.color(), hide=hideAll).track_washu()
        self.priority += 1
        return track

    def _getCreTracks(self, cts):
        assays = ["dnase", "h3k4me3", "h3k27ac", "ctcf"]
        cache = self.cacheW[self.assembly]
        assaymap = cache.assaymap

        ret = OrderedDict()
        for tct in cts:
            ct = tct["ct"]
            ret[ct] = {}
            ctInfos = cache.datasets.byCellType[ct]  # one per assay
            displayCT = ctInfos[0].get("cellTypeDesc")
            if not displayCT:
                displayCT = ctInfos[0]["cellTypeName"]
            displayCT = displayCT[:50]

            # else JSON will be invalid for WashU
            ctwu = ct.replace("'", "_").replace('"', '_')
            tissue = tct["tissue"]
            fileIDs = []
            ret[ct]["signal"] = []
            ret[ct]["9state"] = []
            for assay in assays:
                if assay in assaymap:
                    if ct in assaymap[assay]:
                        expBigWigID = assaymap[assay][ct]
                        expID = expBigWigID[0]
                        fileID = expBigWigID[1]
                        fileIDs.append(fileID)
                        ti = TrackInfo(cache, displayCT, tissue[:50],
                                       assay, expID, fileID)
                        ret[ct]["signal"].append(ti)
                        fn = fileID + ".bigBed"
                        url = os.path.join(WWW, "9-State", fn)
                        ret[ct]["9state"].append((assay, displayCT, url))
            fn = '_'.join(fileIDs) + ".cREs.bigBed"
            ret[ct]["cts"] = []
            url = os.path.join(WWW, fn)
            ret[ct]["cts"].append((fileID, displayCT, url))
        return ret

    def _addSignalFiles(self, accession, j):
        pgSearch = PGsearch(self.ps, self.assembly)

        cache = self.cacheW[self.assembly]
        cre = CRE(pgSearch, accession, cache)

        if "version" not in j:
            ct = j.get("cellType", None)
            if not ct:
                topN = 5
                topCellTypes = cre.topTissues()["dnase"]
                tcts = sorted(topCellTypes, key=lambda x: x["one"],
                              reverse=True)[:topN]
            else:
                tcts = [{"ct": ct, "tissue": ct}]
        else:
            if 2 == j["version"]:
                tcts = []
                for ct in j["cellTypes"]:
                    tcts.append({"ct": ct, "tissue": ct})

        tracksByCt = self._getCreTracks(tcts)

        for ct, tracksByType in tracksByCt.iteritems():
            for fileID, tct, url in tracksByType["cts"]:
                if self.browser in [UCSC, ENSEMBL]:
                    self.lines += self.makeSuperTracks(cache, fileID, tct, url,
                                                       j["showCombo"],
                                                       tracksByType["signal"],
                                                       tracksByType["9state"])

    def makeSuperTracks(self, cache, fileID, tct, url, showCombo,
                        signals, nineState, moreTracks=True, hideAll=False,
                        signalOnly=False):
        tn = tct.replace(" ", "_")
        stname = "super_" + tn

        supershow = "on show"
        if hideAll:
            supershow = "on"

        ret = ["""
track {stname}
superTrack {supershow}
group regulation
shortLabel {tct_short}
longLabel {tct_long}
        """.format(supershow=supershow,
                   stname=stname,
                   tct_short=tct[:17],
                   tct_long=tct[:80])]

        shortLabel = "cREs in " + tct
        title = ' '.join(["cREs in", tct, '(5 group)'])
        t = PredictionTrack(title, self.priority, url, showCombo).track()
        self.priority += 1
        ret.append("""
track {tn}
parent {stname}
""".format(tn="fivegroup_" + tn, stname=stname) + t)

        assays = {"dnase": "DNase",
                  "h3k27ac": "H3k27ac",
                  "h3k4me3": "H3K4me3",
                  "ctcf": "CTCF"}

        for assay, displayCT, turl in nineState:
            a = assay
            if a in assays:
                a = assays[a]
            shortLabel = ' '.join([tct, "cREs", a])
            title = ' '.join(["cREs in", tct, "with high", a, '(9 state)'])
            show = not showCombo
            if hideAll:
                show = False
            t = PredictionTrack(title, self.priority, turl,
                                show).track(shortLabel)
            self.priority += 1
            ret.append("""
track {tn}
parent {stname}
""".format(tn="ninegroup_" + tn, stname=stname) + t)

        for ti in signals:
            ret.append(self.trackhubExp(ti, stname, hideAll))

        return ret

    def mtColor(self, assay, mt):
        c = None
        if mt["tf"] in AssayColors:
            c = AssayColors[mt["tf"]][0]
        if not c:
            if "ChIP-seq" == assay and "transcription" in mt["target"]:
                if "CTCF" == mt["tf"]:
                    c = AssayColors["CTCF"][0]
                else:
                    c = AssayColors["TF ChIP-seq"][0]
        return c

    def mtTrackBigWig(self, tct, mt, bw, stname):
        url = "https://www.encodeproject.org/files/{e}/@@download/{e}.bigWig?proxy=true".format(e=bw)

        assay = mt["assay_term_name"]
        desc = ' '.join([bw, "Signal", assay, mt["target"], mt["tf"], tct])
        shortLabel = desc[:17]

        track = BigWigTrack(desc, self.priority, url, self.mtColor(assay, mt),
                            stname, "0:50", True).track(shortLabel)
        self.priority += 1
        return track

    def mtTrackBed(self, tct, mt, bw, stname):
        url = "https://www.encodeproject.org/files/{e}/@@download/{e}.bigBed?proxy=true".format(e=bw)

        assay = mt["assay_term_name"]
        desc = ' '.join([bw, "Peaks", mt["assay_term_name"], mt["target"],
                         mt["tf"], tct])
        shortLabel = desc[:17]

        track = BigBedTrack(desc, self.priority, url, self.mtColor(assay, mt),
                            stname, True).track(shortLabel)
        self.priority += 1
        return track

    def makeTrackDb(self, accession, j):
        lines = self.getLines(accession, j)

        f = StringIO.StringIO()
        map(lambda line: f.write(line + "\n"), lines)

        return f.getvalue()

    def makePos(self, p):
        halfWindow = 2500
        start = str(max(1, p.start - halfWindow))
        end = str(p.end + halfWindow)
        return p.chrom + ':' + start + '-' + end


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
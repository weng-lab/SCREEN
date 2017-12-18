#!/usr/bin/python

import sys
import cherrypy
import os
import StringIO
from collections import OrderedDict

import trackhub_helpers as Helpers

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from utils import AddPath

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common'))
from config import Config

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
    def __init__(self, assembly, assay, show5group, cREaccession, parent, active, ct):
        self.assembly = assembly
        self.assay = assay
        self.show5group = show5group
        self.cREaccession = cREaccession
        self.parent = parent
        self.active = active
        self.ct = ct
        self.p = self._init()

    def _init(self):
        p = OrderedDict()
        p["track"] = Helpers.sanitize(self.cREaccession)
        p["parent"] = self.parent
        p["bigDataUrl"] = self._url()
        p["visibility"] = Helpers.viz("dense", self.active)
        p["type"] = "bigBed 9"

        if 'general' == self.ct:
            if self.show5group:
                shortLabel = ["general 5g cREs"]
                longLabel = ["general 5-group cREs"]
            else:
                shortLabel = ["9s", self.ct]
                longLabel =  ["general cREs", "with high", self.assay, '(9 state)']
        else:
            if self.show5group:
                shortLabel = ["5g", self.ct]
                longLabel = ["cREs in", self.ct, '(5 group)']
            else:
                shortLabel = ["9s", self.assay, self.ct]
                longLabel =  ["cREs in", self.ct, "with high", self.assay, '(9 state)']
            
        p["shortLabel"] = Helpers.makeShortLabel(*shortLabel)
        p["longLabel"] = Helpers.makeLongLabel(*longLabel)
        p["itemRgb"] = "On"
        p["darkerLabels"] = "on"
        return p

    def _url(self):
        return EncodeUrlBigBed(self.cREaccession)
    
    def lines(self, priority):
        return ''.join([x for x in outputLines(self.p, 1, {"priority": priority})])
        

class BigWigTrack(object):
    def __init__(self, assembly, expID, fileID, assay, parent, active, ct):
        self.assembly = assembly
        self.expID = expID
        self.fileID = fileID
        self.assay = assay
        self.parent = parent
        self.active = active
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
        p["longLabel"] = Helpers.makeLongLabel(self._desc())
        p["itemRgb"] = "On"
        p["darkerLabels"] = "on"
        p["autoScale"] = "off"
        p["viewLimits"] = self._signalMax()
        return p

    def _desc(self):
        return ' '.join([self.assay, "Signal in", self.ct, self.expID])
    
    def _signalMax(self):
        if "DNase" == self.assay:
            return "0:150"
        return "0:50"

    def _url(self):
        return EncodeUrlBigWig(self.fileID)
    
    def lines(self, priority):
        return ''.join([x for x in outputLines(self.p, 1, {"priority": priority})])


class TrackhubDb:
    def __init__(self, ps, cacheW, db):
        self.ps = ps
        self.cacheW = cacheW
        self.db = db

    def ucsc_trackhub(self, *args, **kwargs):
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
        self.lines = self.generalCREs(show5group)

        for ct in j["cellTypes"]:
            self.lines += self._add_ct(ct, show5group)

        return filter(lambda x: x, self.lines)

    def generalCREs(self, show5group):
        superTrackName = Helpers.sanitize("super_" + 'general cREs')
        ret = self.makeSuperTrack('general cREs', superTrackName)
        
        cREaccession = AgnosticCres["5-group"][self.assembly]
        t = cRETrack(self.assembly, '', True, cREaccession, superTrackName,
                     True == show5group, 'general').lines(self.priority)
        self.priority += 1
        ret += [t]
        
        for assay in ["H3K4me3", "H3K27ac", "CTCF"]:
            cREaccession = AgnosticCres["9-state"][assay][self.assembly]
            t = cRETrack(self.assembly, assay, False, cREaccession, superTrackName,
                         False == show5group, 'general').lines(self.priority)
            self.priority += 1
            ret += [t]

        return ret

    def _add_ct(self, ct, show5group):
        superTrackName = Helpers.sanitize("super_" + ct)

        ret = self.makeSuperTrack(ct, superTrackName)
        ret += self._add_ct_cREs(ct, show5group, superTrackName)
        ret += self._add_ct_bigWigs(ct, show5group, superTrackName)
        return ret

    def _add_ct_cREs(self, ct, show5group, superTrackName):
        #cRE biosample-specific tracks
        ret = []

        cache = self.cacheW[self.assembly]
        cREs = cache.creBigBeds[ct]
        if show5group:
            cREaccession = cREs["5group"]
            url = EncodeUrlBigBed(cREaccession)
            t = cRETrack(self.assembly, '', show5group, cREaccession, superTrackName,
                         True, ct).lines(self.priority)
            self.priority += 1
            ret += [t]
        else:
            for assay in ["DNase", "H3K4me3", "H3K27ac", "CTCF"]:
                key = "9state-" + assay
                if key not in cREs:
                    continue
                cREaccession = cREs[key]
                t = cRETrack(self.assembly, assay, show5group, cREaccession, superTrackName,
                              True, ct).lines(self.priority)
                self.priority += 1
                ret += [t]
        return ret

    def _add_ct_bigWigs(self, ct, show5group, superTrackName):
        # bigWig signal tracks
        ret = []

        cache = self.cacheW[self.assembly]
        for expInfo in cache.datasets.byCellType[ct]:
            t = BigWigTrack(self.assembly, expInfo["expID"], expInfo["fileID"],
                            expInfo["assay"], superTrackName, True, ct).lines(self.priority)
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

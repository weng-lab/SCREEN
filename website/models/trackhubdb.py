#!/usr/bin/python

import sys
import StringIO
import cherrypy
import json
import os
import heapq
import re
from collections import OrderedDict

from trackinfo import TrackInfo

from common.coord import Coord
from models.cre import CRE
from common.pg import PGsearch
from common.db_trackhub import DbTrackhub

from common.helpers_trackhub import Track, PredictionTrack, BigGenePredTrack, BigWigTrack, officialVistaTrack, bigWigFilters, BIB5, TempWrap, BigBedTrack

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common'))
from constants import paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs

UCSC = 1
WASHU = 2
ENSEMBL = 3

#WWW = "http://users.wenglab.org/moorej3/cREs"
WWW = "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10"

AssayColors = {"DNase" : ["6,218,147", "#06DA93"],
               "RNA-seq" : ["0,170,0", "", "#00aa00"],
               "RAMPAGE" : ["214,66,202", "#D642CA"],
               "H3K4me1" : ["255,223,0", "#FFDF00"],
               "H3K4me2" : ["255,255,128", "#FFFF80"],
               "H3K4me3" : ["255,0,0", "#FF0000"],
               "H3K9ac" : ["255,121,3", "#FF7903"],
               "H3K27ac" : ["255,205,0", "#FFCD00"],
               "H3K27me3" : ["174,175,174", "#AEAFAE"],
               "H3K36me3" : ["0,128,0", "#008000"],
               "H3K9me3" : ["180,221,228", "#B4DDE4"],
               "Conservation" : ["153,153,153", "#999999"],
               "TF ChIP-seq" : ["18,98,235", "#1262EB"],
               "CTCF" : ["0,176,240", "#00B0F0"]}

class TrackhubDb:
    def __init__(self, templates, ps, cacheW, db, browser):
        self.templates = templates
        self.ps = ps
        self.cacheW = cacheW
        self.db = db
        self.browser = browser

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

    def ensembl_trackhub(self, *args, **kwargs):
        #print("ensembl args **************** :", args)
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

        return "invalid path"

    def washu_trackhub(self, *args, **kwargs):
        cherrypy.response.headers['Content-Type'] = 'text/plain'

        #print("washu args ************:", args)
        uuid = args[0]

        if 3 != len(args):
            return { "error" : "wrong num of args", "args" : args }

        try:
            info = self.db.get(uuid)
        except:
            raise
            return {"error" : "couldn't find uuid", "args" : args }

        self.assembly = info["assembly"]

        loc = args[2]
        if loc.startswith("trackDb_") and loc.endswith(".json"):
            self.hubNum = loc.split('_')[1].split('.')[0]
            return self.makeTrackDbWashU(info["reAccession"], info["j"])

        return {"error" : "invalid path", "args" : args }

    def makeGenomes(self):
        return """genome\t{assembly}
trackDb\t{assembly}/trackDb_{hubNum}.txt""".format(assembly = self.assembly,
                                                   hubNum = self.hubNum)

    def makeHub(self):
        f = StringIO.StringIO()
        t = "ENCODE Candidate Regulatory Elements " + self.assembly
        if Config.ribbon:
            t += " (%s)" % Config.ribbon
        
        for r in [["hub", t],
                  ["shortLabel", t],
                  ["longLabel", t],
                  ["genomesFile", "genomes_{hubNum}.txt".format(hubNum=
                                                                self.hubNum)],
                  ["email", "zhiping.weng@umassmed.edu"]]:
            f.write(" ".join(r) + "\n")
        return f.getvalue()

    def generalCREs(self, showCombo):
        base = os.path.join("http://bib7.umassmed.edu/~purcarom",
                            "encyclopedia/Version-4",
                            "ver10", self.assembly)
        if self.browser in [UCSC, ENSEMBL]:
            if showCombo:
                url = os.path.join(base, self.assembly + "-cREs-V10.bigBed")
                t = PredictionTrack("general cREs (5 group)",
                                    self.priority, url, True).track("general cREs (5 group)")
                self.priority += 1
            else:
                t = ""
                for assay in ["CTCF", "Enhancer", "Promoter"]:
                    url = os.path.join(WWW, self.assembly +
                                       "-cRE." + assay + ".cREs.bigBed")
                    a = assay
                    if a == "Enhancer":
                        a = "H3K27ac"
                    if a == "Promoter":
                        a = "H3K4me3" 
                    t += PredictionTrack("general cREs (9 state) " + a,
                                         self.priority, url,
                                         True).track("general cREs (9 state) " + a)
                    self.priority += 1
        else:
            url = os.path.join(base, self.assembly + "-cREs-V10.bed.gz")
            t = Track("cREs",
                      self.priority, url,
                      type = "hammock").track_washu()
            self.priority += 1
        return t

    def trackhubExp(self, trackInfo, stname):
        url = "https://www.encodeproject.org/files/{e}/@@download/{e}.bigWig?proxy=true".format(e=trackInfo.fileID)
        if self.browser in [WASHU, ENSEMBL]:
            url = os.path.join("http://bib7.umassmed.edu/~purcarom/bib5/annotations_demo/data/",
                               trackInfo.expID, trackInfo.fileID + ".bigWig")

        desc = trackInfo.desc()
        shortLabel = trackInfo.shortLabel()
        
        if self.browser in [UCSC, ENSEMBL]:
            track = BigWigTrack(desc, self.priority, url,
                                trackInfo.color(), stname,
                                trackInfo.signalMax()).track(shortLabel)
        else:
            track = BigWigTrack(desc, self.priority, url,
                                trackInfo.color()).track_washu()
        self.priority += 1
        return track

    def _getCreTracks(self, cts):
        assays = ["dnase", "h3k4me3", "h3k27ac", "ctcf"]
        cache = self.cacheW[self.assembly]
        assaymap = cache.assaymap

        ret = OrderedDict()
        for tct in sorted(cts, key = lambda x: x["ct"]):
            ct = tct["ct"]
            ret[ct] = {}
            ctInfos = cache.datasets.byCellType[ct] # one per assay
            displayCT = ctInfos[0]["cellTypeDesc"][:50]

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

    def getLines(self, accession, j):
        self.priority = 1

        self.lines  = []
        if self.browser in [UCSC, ENSEMBL]:
            self.lines += [self.generalCREs(j["showCombo"])]

        self._addSignalFiles(accession, j)

        return filter(lambda x: x, self.lines)

    def _addSignalFiles(self, accession, j):
        pgSearch = PGsearch(self.ps, self.assembly)

        cache = self.cacheW[self.assembly]
        cre = CRE(pgSearch, accession, cache)

        if "version" not in j:
            ct = j.get("cellType", None)
            if not ct:
                topN = 5
                topCellTypes = cre.topTissues()["dnase"]
                tcts = sorted(topCellTypes, key = lambda x: x["one"],
                              reverse=True)[:topN]
            else:
                tcts = [{"ct" : ct, "tissue" : ct}]
        else:
            if 2 == j["version"]:
                tcts = []
                for ct in j["cellTypes"]:
                    tcts.append({"ct" : ct, "tissue" : ct})

        tracksByCt = self._getCreTracks(tcts)

        for ct, tracksByType in tracksByCt.iteritems():
            for fileID, tct, url in tracksByType["cts"]:
                if self.browser in [UCSC, ENSEMBL]:
                    self.lines += self.makeSuperTracks(cache, fileID, tct, url,
                                                       j["showCombo"],
                                                       tracksByType["signal"],
                                                       tracksByType["9state"])

    def makeSuperTracks(self, cache, fileID, tct, url, showCombo,
                        signals, nineState):
        tn = tct.replace(" ", "_")
        stname = tn + "_super"
        
        ret = ["""
track {stname}
superTrack on show
group regulation
shortLabel {tct}
longLabel {tct}
        """.format(stname = stname, tct=tct)]

        shortLabel = "cREs in " + tct
        title = ' '.join(["cREs in", tct, '(5 group)'])
        t = PredictionTrack(title, self.priority, url, showCombo).track()
        self.priority += 1
        ret.append("""
track {tn}
parent {stname}
""".format(tn = "fivegroup_" + tn,  stname = stname) + t)

        assays  = {"dnase" : "DNase",
                   "h3k27ac" : "H3k27ac",
                   "h3k4me3" : "H3K4me3",
                   "ctcf" : "CTCF"}

        for assay, displayCT, turl in nineState:
            a = assay
            if a in assays:
                a = assays[a]
            shortLabel = ' '.join([tct, "cREs", a])
            title = ' '.join(["cREs in", tct, "by high", a, '(9 state)'])
            t = PredictionTrack(title, self.priority, turl,
                                not showCombo).track(shortLabel)
            self.priority += 1
            ret.append("""
track {tn}
parent {stname}
""".format(tn = "ninegroup_" + tn, stname = stname) + t)

        for ti in signals:
            ret.append(self.trackhubExp(ti, stname))

        mts = []
        if tct in cache.moreTracks:
            mts = cache.moreTracks[tct]
            for mt in mts:
                for bw in mt["bigWigs"]:
                    ret.append(self.mtTrackBigWig(tct, mt, bw, stname))
                for bed in mt["beds"]:
                    ret.append(self.mtTrackBed(tct, mt, bed, stname))
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

    def makeTrackDbWashU(self, accession, j):
        lines = self.getLines(accession, j)

        if 0:
            pos = [self.makePos(x) for x in self.re_pos]
            lines = [{"type" : "splinters", "list" : sorted(pos)}] + lines

        return json.dumps(lines)


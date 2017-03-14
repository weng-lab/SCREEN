#!/usr/bin/python

import sys
import StringIO
import cherrypy
import json
import os
import heapq
import re

from trackinfo import TrackInfo

from common.coord import Coord
from models.cre import CRE
from common.pg import PGsearch
from common.db_trackhub import DbTrackhub

from common.helpers_trackhub import Track, PredictionTrack, BigGenePredTrack, BigWigTrack, officialVistaTrack, bigWigFilters, BIB5, TempWrap, BigBedTrack

from common.colors_trackhub import PredictionTrackhubColors, OtherTrackhubColors

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common'))
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs

UCSC = 1
WASHU = 2
ENSEMBL = 3

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

        for r in [["hub", t],
                  ["shortLabel", t],
                  ["longLabel", t],
                  ["genomesFile", "genomes_{hubNum}.txt".format(hubNum=
                                                                self.hubNum)],
                  ["email", "zhiping.weng@umassmed.edu"]]:
            f.write(" ".join(r) + "\n")
        return f.getvalue()

    def mp(self):
        base = os.path.join("http://bib7.umassmed.edu/~purcarom",
                            "encyclopedia/Version-4",
                            "ver10", self.assembly)
        if self.browser in [UCSC, ENSEMBL]:
            url = os.path.join(base, "hg19-cREs-V10.bigBed")
            t = PredictionTrack("Candidate Regulatory Elements",
                                self.priority, url).track()
        else:
            url = os.path.join(base, "hg19-cREs-V10.bed.gz")
            t = Track("Candidate Regulatory Elements",
                      self.priority, url, 
                      type = "hammock").track_washu()
        self.priority += 1
        return t

    def trackhubExp(self, trackInfo):
        fnp = os.path.join(Dirs.encode_data, trackInfo.expID,
                           trackInfo.fileID + ".bigWig")
        if not os.path.exists(fnp):
            return None

        url = "https://www.encodeproject.org/files/{e}/@@download/{e}.bigWig?proxy=true".format(e=trackInfo.fileID)
        if self.browser in [WASHU, ENSEMBL]:
            url = os.path.join("http://bib7.umassmed.edu/~purcarom/bib5/annotations_demo/data/",
                               trackInfo.expID, trackInfo.fileID + ".bigWig")

        desc = Track.MakeDesc(trackInfo.name(), "", trackInfo.cellType())

        if self.browser in [UCSC, ENSEMBL]:
            track = BigWigTrack(desc, self.priority, url, trackInfo.color()).track()
        else:
            track = BigWigTrack(desc, self.priority, url, trackInfo.color()).track_washu()
        self.priority += 1
        return track

    def _getTrackList(self, cts):
        tracks = []
        cache = self.cacheW[self.assembly]

        assays = ["dnase", "h3k4me3", "h3k27ac", "ctcf"]
        assaymap = cache.assaymap

        ctsTracks = []
        
        for tct in cts:
            ct = tct["ct"]
            # else JSON will be invalid for WashU
            ctwu = ct.replace("'", "_").replace('"', '_')
            tissue = tct["tissue"]
            fileIDs = []
            for assay in assays:
                if assay in assaymap:
                    if ct in assaymap[assay]:
                        expBigWigID = assaymap[assay][ct]
                        expID = expBigWigID[0]
                        fileID = expBigWigID[1]
                        fileIDs.append(fileID)
                        ti = TrackInfo(ct[:50], tissue[:50], assay, expID, fileID)
                        tracks.append(ti)
            fn = '_'.join(fileIDs) + ".cREs.bigBed"
            fnp = paths.path(self.assembly, "public_html", "cts", fn)
            if os.path.exists(fnp):
                url = os.path.join("http://bib7.umassmed.edu/~purcarom",
                                   "encyclopedia", "Version-4",
                                   "ver10", self.assembly, "cts", fn)
                ctsTracks.append(url)
        return ctsTracks, tracks

    def getLines(self, accession, j):
        self.priority = 1

        self.lines  = []
        if "hg19" == self.assembly:
            if self.browser in [UCSC, ENSEMBL]:
                self.lines += [self.mp()]

        self._addSignalFiles(accession, j)
            
        return filter(lambda x: x, self.lines)

    def _addSignalFiles(self, accession, j):
        pgSearch = PGsearch(self.ps, self.assembly)

        cre = CRE(pgSearch, accession, self.cacheW[self.assembly])

        ct = j.get("cellType", None)
        if not ct:
            topN = 5
            topCellTypes = cre.topTissues()["dnase"]
            tcts = sorted(topCellTypes, key = lambda x: x["one"],
                          reverse=True)[:topN]
        else:
            tcts = [{"ct" : ct, "tissue" : ct}]
            
        ctsTracks, tracks = self._getTrackList(tcts)
        for url in ctsTracks:
            if self.browser in [UCSC, ENSEMBL]:
                title = "Candidate Regulatory Elements"
                if ct:
                    title +=  "in " + ct
                t = PredictionTrack(title, self.priority, url).track()
                self.priority += 1
                self.lines += [t]

        for ti in tracks:
            self.lines += [self.trackhubExp(ti)]

    
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


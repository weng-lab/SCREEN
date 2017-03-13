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
            return self.makeTrackDb(info["reAccession"])
        if loc.startswith("trackDb_") and loc.endswith(".html"):
            self.hubNum = loc.split('_')[1].split('.')[0]
            return self.makeTrackDb(info["reAccession"]).replace("\n", "<br/>")

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
            return self.makeTrackDb([info["reAccession"]])

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
            return self.makeTrackDbWashU([info["reAccession"]])

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
        base = os.path.join("http://bib7.umassmed.edu/~purcarom/encyclopedia/Version-4",
                            "ver10", self.assembly)
        if "hg19" == self.assembly:
            ucsc_url = os.path.join(base, "hg19-cREs-V10.bigBed")
        washu_url = os.path.join(base, "hg19-cREs-V10.bed.gz")
        if self.browser in [UCSC, ENSEMBL]:
            t = BigBedTrack("Candidate Regulatory Elements",
                            self.priority, ucsc_url,
                            PredictionTrackhubColors.distal_regions.rgb).track()
        else:
            t = Track("Candidate Regulatory Elements",
                      self.priority,
                      washu_url,
                      color = PredictionTrackhubColors.distal_regions.rgb,
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

    def _getTrackList(self, topCellTypes):
        tracks = []
        cache = self.cacheW[self.assembly]
        topN = 5

        assays = ["dnase", "h3k27ac", "h3k4me3", "ctcf"]
        assaymap = cache.assaymap

        tcts = sorted(topCellTypes, key = lambda x: x["one"], reverse=True)[:topN]
        for tct in tcts:
            ct = tct["ct"]
            # else JSON will be invalid for WashU
            ctwu = ct.replace("'", "_").replace('"', '_')
            tissue = tct["tissue"]
            for assay in assays:
                if assay in assaymap:
                    if ct in assaymap[assay]:
                        expBigWigID = assaymap[assay][ct]
                        expID = expBigWigID[0]
                        fileID = expBigWigID[1]
                        ti = TrackInfo(ct, tissue, assay, expID, fileID)
                        tracks.append(ti)
        return tracks

    def getLines(self, accession):
        self.priority = 1

        self.lines  = []
        self.lines += [self.mp()]

        pgSearch = PGsearch(self.ps, self.assembly)

        cre = CRE(pgSearch, accession, self.cacheW[self.assembly])

        topTissues = cre.topTissues()["dnase"]
        for ti in self._getTrackList(topTissues):
            self.lines += [self.trackhubExp(ti)]

        return filter(lambda x: x, self.lines)

    def makeTrackDb(self, accession):
        lines = self.getLines(accession)

        f = StringIO.StringIO()
        map(lambda line: f.write(line + "\n"), lines)

        return f.getvalue()

    def makePos(self, p):
        halfWindow = 2500
        start = str(max(1, p.start - halfWindow))
        end = str(p.end + halfWindow)
        return p.chrom + ':' + start + '-' + end

    def makeTrackDbWashU(self, accessions):
        lines = self.getLines(accessions)

        if 0:
            pos = [self.makePos(x) for x in self.re_pos]
            lines = [{"type" : "splinters", "list" : sorted(pos)}] + lines

        return json.dumps(lines)


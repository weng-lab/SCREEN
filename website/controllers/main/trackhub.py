#!/usr/bin/python

import StringIO
import cherrypy
import json
import os
import uuid

from common.helpers_trackhub import Track, PredictionTrack, BigGenePredTrack, BigWigTrack, officialVistaTrack, bigWigFilters, BIB5, TempWrap, BigBedTrack

from common.colors_trackhub import PredictionTrackhubColors, EncodeTrackhubColors, OtherTrackhubColors

from common.db_trackhub import DbTrackhub
from common.session import Sessions
from models.regelm_detail import RegElementDetails

class TrackhubController:
    def __init__(self, templates, es, ps, version, webSocketUrl):
        self.templates = templates
        self.es = es
        self.ps = ps
        self.version = version
        self.webSocketUrl = webSocketUrl        

        self.assembly = "hg19"
        self.debug = False

        #self.sessions = Sessions(self.ps.DBCONN)
        #self.session_uid = self.session_uuid()
        #self.db = DbTrackhub(self.ps.DBCONN)

        self.isUcsc = True
        
    def makeUid(self):
        return str(uuid.uuid4())

    def session_uuid(self):
        uid = self.sessions.get(cherrypy.session.id)
        if not uid:
            uid = self.makeUid()
            cherrypy.session["uid"] = uid
            self.sessions.insert(cherrypy.session.id, uid)
        return uid

    def setReAccession(self, reAccession):
        self.hubNum = self.db.insertOrUpdate(reAccession,
                                             "hg19",
                                             "",
                                             "",
                                             "",
                                             self.session_uid)
        return {"hubNum" : self.hubNum,
                "uuid" : self.session_uid}
    
    def ucsc_trackhub(self, *args, **kwargs):
        print("args:", args)
        args = args[0]
        if not args[0].startswith('EE'):
            return "first arg must be EE<num>"
        re_accession = args[0]

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
            return self.makeTrackDb([re_accession])

        return "invalid path"

    def makeGenomes(self):
        return """genome\t{assembly}
trackDb\t{assembly}/trackDb_{hubNum}.txt""".format(assembly = self.assembly,
                                                   hubNum = self.hubNum)

    def makeHub(self):
        f = StringIO.StringIO()
        t = ""
        if self.debug:
            t += "debug "
        t += "ENCODE Candidate Regulatory Elements " + self.assembly

        for r in [["hub", t],
                  ["shortLabel", t],
                  ["longLabel", t],
                  ["genomesFile", "genomes_{hubNum}.txt".format(hubNum=
                                                                self.hubNum)],
                  ["email", "zhiping.weng@umassmed.edu"]]:
            f.write(" ".join(r) + "\n")
        return f.getvalue()

    def genes(self):
        if "hg19" == self.assembly:
            return None

        byAssembly = {"mm10" : "Comprehensive M8",
                      "hg19" : "Comprehensive 24"}
        desc = "GENCODE Genes " + byAssembly[self.assembly]

        byAssemblyURl = {"mm10" : os.path.join(BIB5, "genes", "gencode.vM8.annotation.bb"),
                         "hg19" : os.path.join(BIB5, "genes", "gencode.v24.annotation.bb")}
        url = byAssemblyURl[self.assembly]

        if self.isUcsc:
            track = BigGenePredTrack(desc, self.priority, url).track()
        else:
            track = BigGenePredTrack(desc, self.priority, url).track_washu()
        self.priority += 1
        return track

    def mp(self):
        ucsc_url = "http://bib5.umassmed.edu/~purcarom/cre/cre.bigBed"
        washu_url = "http://bib5.umassmed.edu/~purcarom/cre/washu/cre.bed.gz"
        if self.isUcsc:
            t = BigBedTrack("Candidate Regulatory Elements",
                            self.priority, ucsc_url,
                            PredictionTrackhubColors.distal_regions.rgb).track()
        else:
            t = Track("Candidate Regulatory Elements",
                      self.priority,
                      washu_url,
                      color = PredictionTrackhubColors.distal_regions.rgb,
                      type = "bed").track_washu()
        self.priority += 1
        return t

    def phastcons(self):
        if "mm10" == self.assembly:
            url =  "http://hgdownload.cse.ucsc.edu/goldenPath/mm10/phastCons60way/mm10.60way.phastCons.bw"
        elif "hg19" == self.assembly:
            url = "http://hgdownload.cse.ucsc.edu/goldenPath/hg19/phastCons100way/hg19.100way.phastCons.bw"

        desc = "phastCons"

        color = OtherTrackhubColors.Conservation.rgb
        if self.isUcsc:
            track = BigWigTrack(desc, self.priority, url, color).track()
        else:
            track = BigWigTrack(desc, self.priority, url, color).track_washu()
        self.priority += 1
        return track

    def trackhubExp(self, name, color, cellType, accession):
        url = "https://www.encodeproject.org/files/{e}/@@download/{e}.bigWig?proxy=true".format(e=accession)

        desc = Track.MakeDesc(name, "", cellType)

        if self.isUcsc:
            track = BigWigTrack(desc, self.priority, url, color).track()
        else:
            track = BigWigTrack(desc, self.priority, url, color).track_washu()
        self.priority += 1
        return track

    def addSignals(self, re_accession):
        red = RegElementDetails(self.es, self.ps)

        for re_accession in re_accessions:
            re = red.reFull(re_accession)
            c = EncodeTrackhubColors.DNase_Signal.rgb
            for cellType, v in re["ranks"]["enhancer"].iteritems():
                self.lines += [self.trackhubExp(v["method"],
                                                c, cellType, v["accession"])]
            for cellType, v in re["ranks"]["promoter"].iteritems():
                self.lines += [self.trackhubExp(v["method"],
                                                c, cellType, v["accession"])]
            for cellType, v in re["ranks"]["ctcf"].iteritems():
                self.lines += [self.trackhubExp(v["method"],
                                                c, cellType, v["accession"])]
            for cellType, v in re["ranks"]["dnase"].iteritems():
                self.lines += [self.trackhubExp(v["method"],
                                                c, cellType, v["accession"])]
            
    def getLines(self, re_accessions):
        self.priority = 0

        self.lines  = []
        self.lines += [self.genes()]
        self.lines += [self.mp()]
        #self.lines += [self.phastcons()]

        self.re_pos = []
        red = RegElementDetails(self.es, self.ps)
        for re_accession in re_accessions:
            re = red.reFull(re_accession)
            self.re_pos.append(re["position"])

        #self.addSignals(re_accessions)

        return filter(lambda x: x, self.lines)
    
    def makeTrackDb(self, re_accessions):
        self.isUcsc = True
        lines = self.getLines(re_accessions)
        
        f = StringIO.StringIO()
        map(lambda line: f.write(line + "\n"), lines)

        return f.getvalue()

    def makePos(self, p):
        return p["chrom"] + ':' + str(p["start"]) + '-' + str(p["end"])
    
    def makeTrackDbWashU(self, re_accessions):
        lines = self.getLines(re_accessions)

        pos = [self.makePos(x) for x in self.re_pos]
        print(pos)
        lines.append({"type" : "splinters",
                      "list" : sorted(pos)})
        return lines

    def washu_trackhub(self, *args, **kwargs):
        self.isUcsc = False
        
        args = args[0]

        if 1 != len(args):
            return { "error" : "too many args" }

        toks = args[0].split('_')
        guid = toks[1].split('.')[0]

        fnp = os.path.join(os.path.dirname(__file__),
                           "../../../data/carts", guid)
        if not os.path.exists(fnp):
            return {"error": "cart %s missing" % kwargs["guid"]}

        with open(fnp, "r") as f:
            accs = f.read().split("\n")[:-1]

        return self.makeTrackDbWashU(accs)

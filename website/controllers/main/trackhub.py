#!/usr/bin/python

import StringIO

from common.helpers_trackhub import Track, PredictionTrack, BigGenePredTrack, BigWigTrack, officialVistaTrack, bigWigFilters, BIB5, TempWrap, BigBedTrack

from common.colors_trackhub import PredictionTrackhubColors, EncodeTrackhubColors, OtherTrackhubColors

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
        
    def ucsc_trackhub(self, *args, **kwargs):
        print("args:", args)
        args = args[0]
        if not args[0].startswith('EE'):
            return "first arg must be EE<num>"
        self.re_accession = args[0]

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
            return self.makeTrackDb()

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

        track = BigGenePredTrack(desc, self.priority, url).track()
        self.priority += 1
        return track

    def mp(self):
        url = "http://bib5.umassmed.edu/~purcarom/cre/cre.bigBed"
        track = BigBedTrack("Candidate Regulatory Elements",
                            self.priority,
                            url).track()
        self.priority += 1
        return track

    def phastcons(self):
        if "mm10" == self.assembly:
            url =  "http://hgdownload.cse.ucsc.edu/goldenPath/mm10/phastCons60way/mm10.60way.phastCons.bw"
        elif "hg19" == self.assembly:
            url = "http://hgdownload.cse.ucsc.edu/goldenPath/hg19/phastCons100way/hg19.100way.phastCons.bw"

        desc = "phastCons"

        color = OtherTrackhubColors.Conservation.rgb
        track = BigWigTrack(desc, self.priority, url, color).track()
        self.priority += 1
        return track

    def trackhubExp(self, name, color, cellType, accession):
        url = "https://encodeproject.org/files/" + accession

        desc = Track.MakeDesc(name, "", cellType)

        track = BigWigTrack(desc, self.priority, url, color).track()
        self.priority += 1
        return track

    def makeTrackDb(self):
        self.priority = 0
        red = RegElementDetails(self.es, self.ps)
        re = red.reFull(self.re_accession)

        lines = []
        lines += [self.genes()]

        lines+= [self.mp()]
        
        for cellType, v in re["ranks"]["enhancer"].iteritems():
            lines += [self.trackhubExp(v["method"],
                                       EncodeTrackhubColors.DNase_Signal.rgb,
                                       cellType, v["accession"])]
        for cellType, v in re["ranks"]["promoter"].iteritems():
            lines += [self.trackhubExp(v["method"],
                                       EncodeTrackhubColors.DNase_Signal.rgb,
                                       cellType, v["accession"])]
        for cellType, v in re["ranks"]["ctcf"].iteritems():
            lines += [self.trackhubExp(v["method"],
                                       EncodeTrackhubColors.DNase_Signal.rgb,
                                       cellType, v["accession"])]
        for cellType, v in re["ranks"]["dnase"].iteritems():
            lines += [self.trackhubExp(v["method"],
                                       EncodeTrackhubColors.DNase_Signal.rgb,
                                       cellType, v["accession"])]

        lines += [self.phastcons()]

        lines = filter(lambda x: x, lines)

        f = StringIO.StringIO()
        map(lambda line: f.write(line + "\n"), lines)

        return f.getvalue()

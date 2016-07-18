#!/usr/bin/env python

import os, sys, json
import StringIO

from helpers_trackhub import Track, PredictionTrack, BigGenePredTrack, BigWigTrack, officialVistaTrack, bigWigFilters, BIB5, TempWrap
from enums import AssayType

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from common.web_epigenomes import WebEpigenome
from common.colors_trackhub import PredictionTrackhubColors, EncodeTrackhubColors, OtherTrackhubColors
from common.site_info import SiteInfos

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../../metadata/utils'))
from utils import Utils
from files_and_paths import Dirs

class TrackHub(object):
    def __init__(self, args, epigenomes, urlStatus, row):
        self.assembly = row["assembly"]
        self.assays = row["assays"]
        self.tissue_ids = json.loads(row["tissues"])
        self.loci = row["loci"]
        self.assayType = row["assayType"]
        self.hubNum = row["hubNum"]

        self.args = args
        self.epigenomes = epigenomes[self.assayType]
        self.urlStatus = urlStatus
        self.histMark = SiteInfos[self.assayType].histMark

        self.priority = 1

    def Custom(self):
        lines = []
        #lines += ["browser hide all"]
        #lines += ["browser pack knownGene refGene ensGene"]
        #lines += ["browser dense snp128"]

        f = StringIO.StringIO()
        map(lambda line: f.write(line + "\n"), lines)

        return f.getvalue()

    def ParsePath(self, path):
        if not path:
            raise Exception("no path")

        if 1 == len(path):
            loc = path[0]
            if loc.startswith("hub_") and loc.endswith(".txt"):
                return self.makeHub()
            if loc.startswith("genomes_") and loc.endswith(".txt"):
                return self.makeGenomes()
            return "ERROR"

        if 2 != len(path):
            raise Exception("path too long")

        assembly = path[0]
        loc = path[1]
        if assembly in ["hg19", "hg38", "mm10"]:
            if assembly == self.assembly:
                if loc.startswith("trackDb_") and loc.endswith(".txt"):
                    return self.makeTrackDb()
        raise Exception("invalid path")

    def makeHub(self):
        f = StringIO.StringIO()
        t = ""
        if self.args.debug:
            t += "debug "
        if AssayType.Enhancer == self.assayType:
            t += "ENCODE Enhancer-like regions " + self.assembly
        elif AssayType.Promoter == self.assayType:
            t += "ENCODE Promoter-like regions " + self.assembly

        for r in [["hub", t],
                  ["shortLabel", t],
                  ["longLabel", t],
                  ["genomesFile", "genomes_{hubNum}.txt".format(hubNum=self.hubNum)],
                  ["email", "zhiping.weng@umassmed.edu"]]:
            f.write(" ".join(r) + "\n")
        return f.getvalue()

    def makeGenomes(self):
        return """genome\t{assembly}
trackDb\t{assembly}/trackDb_{hubNum}.txt""".format(assembly = self.assembly,
                                                   hubNum = self.hubNum)

    def makeTrackDb(self):
        epis = self.epigenomes.GetByAssemblyAndAssays(self.assembly, self.assays)
        epis = filter(lambda e: e.web_id() in self.tissue_ids, epis.epis)

        lines = []
        lines += [self.genes()]

        for wepi in sorted(epis, key=lambda e: e.epi.biosample_term_name):
            if self.assays.startswith("BothDNaseAnd"):
                lines += [self.predictionTrackHub(wepi)]
                if AssayType.Enhancer == self.assayType:
                    lines += [self.compositeTrack(wepi)]
            for exp in wepi.exps():
                try:
                    lines += [self.trackhubExp(exp)]
                except:
                    if self.args.debug:
                        raise
                    pass

        if self.enableVistaTrack():
            lines += [self.vista()]
        lines += [self.phastcons()]

        lines = filter(lambda x: x, lines)

        f = StringIO.StringIO()
        map(lambda line: f.write(line + "\n"), lines)

        return f.getvalue()

    def enableVistaTrack(self):
        if "mm10" == self.assembly:
            for t in self.tissue_ids:
                if "11_5" in t:
                    return True
        return False

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

    def vista(self):
        return officialVistaTrack(self.assembly) + "\n"

    def predictionTrackHub(self, wepi):
        fnp = wepi.predictionFnp()
        if not os.path.exists(fnp):
            return None

        if AssayType.Enhancer == self.assayType:
            descBase = "enhancer-like"
            url = os.path.join(BIB5,
                               Dirs.enhancerTracksBase,
                               os.path.basename(fnp))
        elif AssayType.Promoter == self.assayType:
            descBase = "promoter-like"
            url = os.path.join(BIB5,
                               Dirs.promoterTracksBase,
                               os.path.basename(fnp))

        desc = Track.MakeDesc(descBase,
                              wepi.epi.age_display,
                              wepi.epi.biosample_term_name)

        track = PredictionTrack(desc, self.priority, url).track(descBase)
        self.priority += 1
        return track

    def trackhubExp(self, exp):
        url, name, color = self._getUrl(exp, False)

        desc = Track.MakeDesc(name, exp.age, exp.biosample_term_name)

        track = BigWigTrack(desc, self.priority, url, color).track()
        self.priority += 1
        return track

    def _getUrl(self, exp, norm):
        if not exp:
            return None, None, None

        assay = "DNase"
        if exp.isH3K27ac():
            assay = "H3K27ac"
        elif exp.isH3K4me3():
            assay = " H3K4me3"

        bigWigs = bigWigFilters(self.assembly, exp.files)

        if not bigWigs:
            raise Exception("missing bigWigs for " + exp.encodeID)
        bigWig = bigWigs[0]

        url = bigWig.url
        if self.urlStatus.find(url) and not self.urlStatus.get(url):
            url = os.path.join(BIB5, "data", bigWig.expID,
                               bigWig.fileID + ".bigWig")

        if norm:
            if "mm10" == self.assembly:
                url = os.path.join(BIB5, "encode_norm", bigWig.expID, bigWig.fileID + ".norm.bigWig")
            else:
                if bigWig.expID.startswith("EN"):
                    url = os.path.join(BIB5, "encode_norm", bigWig.expID, bigWig.fileID + ".norm.bigWig")
                else:
                    url = os.path.join(BIB5, "roadmap_norm/consolidated/",
                                       bigWig.expID,
                                       bigWig.fileID + '-' + assay + ".fc.signal.norm.bigWig")

        if exp.isH3K27ac():
            name = "H3K27ac Signal"
            color = EncodeTrackhubColors.H3K27ac_Signal.rgb
        elif exp.isH3K4me3():
            name = "H3K4me3 Signal"
            color = EncodeTrackhubColors.H3K4me3_Signal.rgb
        elif exp.isDNaseSeq():
            name = "DNase Signal"
            color = EncodeTrackhubColors.DNase_Signal.rgb
        else:
            raise Exception("unexpected exp")

        return url, name, color

    def compositeTrack(self, wepi):
        dnaseExp, histoneExp = wepi.exps()
        histoneUrl, histoneName, histoneColor = self._getUrl(histoneExp, True)
        dnaseUrl, dnaseName, dnaseColor = self._getUrl(dnaseExp, True)

        desc = wepi.web_title()
        descShort = desc

        track = """
track composite{priority}
container multiWig
aggregate transparentOverlay
showSubtrackColorOnUi on
type bigWig 0 50.0
maxHeightPixels 128:32:8
shortLabel {descShort}
longLabel {desc}
visibility full
priority {priority}
html examplePage

                track composite{priority}Histone
                bigDataUrl {histoneUrl}
                shortLabel {histone}
                longLabel {histone}
                parent composite{priority}
                type bigWig
                color {histoneColor}

                track composite{priority}DNase
                bigDataUrl {dnaseUrl}
                shortLabel DNase
                longLabel DNase
                parent composite{priority}
                type bigWig
                color {dnaseColor}
""".format(priority = self.priority,
           descShort = descShort,
           desc = desc,
           histoneUrl = histoneUrl,
           histoneColor = histoneColor,
           dnaseUrl = dnaseUrl,
           dnaseColor = dnaseColor,
           histone = self.histMark)

        self.priority += 1
        return track

    def showMissing(self):
        wepis = self.epigenomes.GetByAssemblyAndAssays(self.assembly, self.assays)

        def checkUrl(url):
            if not url:
                return {"title" : None, "url" : None}

            if not self.urlStatus.find(url):
                self.urlStatus.insertOrUpdate(url,
                                              Utils.checkIfUrlExists(url))
            if self.urlStatus.get(url):
                if "encodeproject" in url:
                    return {"title" : "OK - ENCODE", "url" : url}
                if BIB5 in url:
                    return {"title" : "OK - zlab", "url" : url}
                if "wustl.edu" in url:
                    return {"title" : "OK - roadmap", "url" : url}
                return {"title" : "OK", "url" : url}

            if "encodeproject" in url:
                return {"title" : "ERROR - ENCODE", "url" : url}
            if BIB5 in url:
                return {"title" : "ERROR - zlab", "url" : url}
            if "wustl.edu" in url:
                return {"title" : "ERROR - roadmap", "url" : url}
            return {"title" : "ERROR", "url" : url}

        def checkExp(exp):
            u, _, _ = self._getUrl(exp, False)
            u = checkUrl(u)
            un, _, _ = self._getUrl(exp, True)
            un = checkUrl(un)
            return u, un

        for wepi in wepis.epis:
            dnaseExp = None
            histoneExp = None
            exps = wepi.exps()
            if self.assays.startswith("BothDNaseAnd"):
                dnaseExp, histoneExp = exps
            elif self.assays in ["H3K27ac", "H3K4me3"]:
                histoneExp = exps[0]
            elif "DNase" == self.assays:
                dnaseExp = exps[0]
            else:
                raise Exception("unknown assay type")

            desc = wepi.web_title()
            dnaseUrl, dnaseUrlNorm = checkExp(dnaseExp)
            histoneUrl, histoneUrlNorm = checkExp(histoneExp)
            yield(desc, dnaseUrl, dnaseUrlNorm,
                  histoneUrl, histoneUrlNorm)

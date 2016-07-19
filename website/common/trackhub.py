#!/usr/bin/env python

import os, sys, json
import StringIO

from helpers_trackhub import Track, PredictionTrack, BigGenePredTrack, BigWigTrack, officialVistaTrack, bigWigFilters, BIB5, TempWrap
from enums import AssayType

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from common.colors_trackhub import PredictionTrackhubColors, EncodeTrackhubColors, OtherTrackhubColors
from common.site_info import SiteInfos

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../../metadata/utils'))
from utils import Utils
from files_and_paths import Dirs

class TrackHub(object):
    def __init__(self, args, row):
        self.assembly = row["assembly"]
        self.assays = row["assays"]
        self.cellTypes = json.loads(row["cellTypes"])
        self.loci = row["loci"]
        self.hubNum = row["hubNum"]

        self.args = args
        self.priority = 1

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
        lines = []
        lines += [self.genes()]

        dataset = Datasets.GetDatasetByAssembly(self.assembly)
        m = MetadataWS(dataset)
        for cellType in self.cellTypes:
            exps = m.biosample_term_name(cellType)

            for exp in sorted(exps, key = lambda x: (x.assay_term_name,
                                                     x.tf, x.lab)):
                lines += [self.trackhubExp(exp)]

        f = StringIO.StringIO()
        for line in lines:
            if line:
                f.write(line + "\n")

        return fileLines + "\n" + f.getvalue()

    def trackhubExp(self, exp):
        if not exp:
            return ""

        bigWigs = bigWigFilters(self.assembly, exp.files)

        if not bigWigs:
            return ""
        bigWig = bigWigs[0]

        url = bigWig.url
        if not url:
            return ""

        color = GetTrackColorSignal(exp)
        if color:
            color = color.rgb

        desc = " ".join([exp.encodeID, exp.biosample_term_name,
                         Labs.translate(exp.lab),
                         exp.assay_term_name, exp.tf])

        track = BigWigTrack(desc, self.priority, url, color).track()
        self.priority += 1
        return track

        if self.enableVistaTrack():
            lines += [self.vista()]
        lines += [self.phastcons()]

        lines = filter(lambda x: x, lines)

        f = StringIO.StringIO()
        map(lambda line: f.write(line + "\n"), lines)

        return f.getvalue()

    def enableVistaTrack(self):
        if "mm10" == self.assembly:
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

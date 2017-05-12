import sys, os

BIB5 = "http://bib5.umassmed.edu/~purcarom/annotations_demo/"

class TempWrap:
    def __init__(self, expID, fileID):
        self.expID = expID
        self.fileID = fileID
        self.url = os.path.join(BIB5, "data", expID, fileID + ".bigWig")
        self.file_status = "not known"

    def isBigWig(self):
        return self.url.endswith(".bigWig")

def bedFilters(assembly, files):
    files = filter(lambda x: x.assembly == assembly, files)
    bfs = [lambda x: x.isBedNarrowPeak() and '1' in x.bio_rep and '2' in x.bio_rep,
           lambda x: x.isBedNarrowPeak() and x.bio_rep == '1',
           lambda x: x.isBedNarrowPeak(),
           lambda x: x.isBedBroadPeak() and x.bio_rep == '1',
           lambda x: x.isBedBroadPeak()
           ]
    for bf in bfs:
        beds = filter(bf, files)
        if beds:
            beds = filter(lambda x: not x.isHotSpot(), beds)
            return beds

def bigWigFilters(assembly, files):
    files = filter(lambda x: x.isBigWig() and x.assembly == assembly, files)
    bfs = [lambda x: x.output_type == "fold change over control" and x.isPooled,
           lambda x: x.output_type == "fold change over control" and '1' in x.bio_rep,
           lambda x: x.output_type == "fold change over control" and '2' in x.bio_rep,
           lambda x: x.output_type == "fold change over control",
           lambda x: x.output_type == "signal of unique reads" and x.isPooled,
           lambda x: x.output_type == "signal of unique reads" and '1' in x.bio_rep,
           lambda x: x.output_type == "signal of unique reads" and '2' in x.bio_rep,
           lambda x: x.output_type == "signal of unique reads",
           lambda bw: bw.isRawSignal() and bw.bio_rep == '1',
           lambda bw: bw.isRawSignal() and bw.bio_rep == '2',
           lambda bw: bw.isSignal() and bw.bio_rep == '1',
           lambda bw: bw.isSignal() and bw.bio_rep == '2',
           lambda bw: bw.isSignal()
           ]
    for bf in bfs:
        bigWigs = filter(bf, files)
        if bigWigs:
            return bigWigs

class Track(object):
    def __init__(self, desc, priority, url,
                 color = None, type = None):
        self.desc = desc
        self.priority = priority

        self.url = url
        if self.url.startswith("https://www.encodeproject.org"):
            if not self.url.endswith("?proxy=true"):
                self.url += "?proxy=true"
            self.url = self.url.replace("https://www.encodeproject.org",
                                        "http://www.encodeproject.org")

        self.visibility = "dense"
        self.type = type
        self.color = color
        self.height = None
        self.autoScale = None
        self.viewLimits = None
        self.superTrackName = None
        
    @staticmethod
    def MakeDesc(name, age, biosample_term_name):
        desc = [biosample_term_name]
        if age and "unknown" != age:
            desc += [age]
        desc += [name]
        desc = " ".join(desc)
        return desc

    def track(self, shortLabel = None):
        if not self.type:
            raise Exception("unknown type")
        if not shortLabel:
            shortLabel = self.desc
        track = ["track " + self.desc.replace(" ", "_"),
                 "type " + self.type,
                 "shortLabel " + shortLabel,
                 "longLabel " + self.desc,
                 "itemRgb On",
                 "visibility " + self.visibility,
                 "priority " + str(self.priority),
                 "darkerLabels on",
                 "bigDataUrl " + self.url]
        if self.color:
            track += ["color " + self.color]
        if self.height:
            track += [self.height]
        if self.autoScale:
            track += ["autoScale " + self.autoScale]
        if self.superTrackName:
            track += ["parent " + self.superTrackName]
        if self.viewLimits:
            track += ["viewLimits " + self.viewLimits]
        track += ["\n"]
        return "\n".join(track)

    def track_washu(self):
        if not self.type:
            raise Exception("unknown type")
        url = self.url
        typee = self.type
        if typee in ["bigBed 8", "bigBed 9"]:
            typee = "hammock"
        track = {"name" : self.desc,
                 "type" : typee,
                 "mode" : "show",
                 #"priority " + str(self.priority),
                 "url" : url}
        if self.color:
            track["colorpositive"] = self.color
        if self.height:
            track["height"] = int(self.height.split(':')[1])
        return track

class PredictionTrack(Track):
    def __init__(self, desc, priority, url, show):
        super(PredictionTrack, self).__init__(desc, priority, url)
        self.color = None
        self.type = "bigBed 9"
        if not show:
            self.visibility = "hide"

class VistaTrack(Track):
    def __init__(self, desc, priority, url):
        super(VistaTrack, self).__init__(desc, priority, url)
        self.color = None
        self.type = "bigBed 5"

class BigWigTrack(Track):
    def __init__(self, desc, priority, url, color, superTrackName = "",
                 viewLimits = None, hide = False):
        super(BigWigTrack, self).__init__(desc, priority, url)
        self.color = color
        self.type = "bigWig"
        self.height = "maxHeightPixels 128:32:8"
        self.visibility = "full"
        if hide:
            self.visibility = "hide"
        if viewLimits:
            self.autoScale = "off"
            self.viewLimits = viewLimits
        else:
            self.autoScale = "on"
        if superTrackName:
            self.superTrackName = superTrackName

class BigGenePredTrack(Track):
    def __init__(self, desc, priority, url):
        super(BigGenePredTrack, self).__init__(desc, priority, url)
        self.color = OtherTrackhubColors.Genes.rgb
        self.type = "bigBed"
        self.visibility = "pack"

class BigBedTrack(Track):
    def __init__(self, desc, priority, url, color):
        super(BigBedTrack, self).__init__(desc, priority, url)
        if color:
            self.color = color
        self.type = "bigBed"
        self.visibility = "pack"

def officialVistaTrack(assembly):
    byAssembly = {"mm10" : """
track VISTAenhancers
bigDataUrl http://portal.nersc.gov/dna/RD/ChIP-Seq/VISTA_enhancer_e/mm10_ext_latest.bb
shortLabel VISTA Enhancers
longLabel Potential Enhancer Sequences Assayed in Mouse
type bigBed 9 +
itemRgb on
url http://enhancer.lbl.gov/cgi-bin/imagedb3.pl?form=presentation&show=1&experiment_id=$P&organism_id=$p
urlLabel Vista Enhancer Browser (elementID:organismID(1 for human, 2 for mouse))
bedNameLabel VISTA Enhancers
html http://portal.nersc.gov/dna/RD/ChIP-Seq/VISTA_enhancer_e/VistaEnhancerTrackHub/enhancerAssay.html
visibility full""",
                  "hg19" : """
track VISTAenhancers
bigDataUrl http://portal.nersc.gov/dna/RD/ChIP-Seq/VISTA_enhancer_e/hg19_ext_latest.bb
shortLabel VISTA Enhancers
longLabel Potential Enhancer Sequences Assayed in Mouse
type bigBed 9 +
itemRgb on
url http://enhancer.lbl.gov/cgi-bin/imagedb3.pl?form=presentation&show=1&experiment_id=$P&organism_id=$p
urlLabel Vista Enhancer Browser
bedNameLabel VISTA Enhancers (elementID:organismID(1 for human, 2 for mouse))
html http://portal.nersc.gov/dna/RD/ChIP-Seq/VISTA_enhancer_e/VistaEnhancerTrackHub/enhancerAssay.html
visibility full"""}
    return byAssembly[assembly]

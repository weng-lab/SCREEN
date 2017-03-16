import re

from common.colors_trackhub import GetTrackColorByAssay

class TrackInfo:
    def __init__(self, ct, tissue, assay, expID, fileID):
        self.ct = ct
        self.tissue = tissue
        self.assay = assay
        self.expID = expID
        self.fileID = fileID

        assays  = {"dnase" : "DNase",
                   "h3k27ac" : "H3k27ac",
                   "h3k4me3" : "H3K4me3",
                   "ctcf" : "CTCF"}
        if self.assay in assays:
            self.assay = assays[self.assay]
        
    def __repr__(self):
        return "\t".join([str(x) for x in [self.ct, self.assay]])

    def name(self):
        ret = " ".join([self.fileID, self.ct, self.assay])
        #ret = re.sub(r'\W+', '', ret)
        return ret

    def color(self):
        return GetTrackColorByAssay(self.assay)

    def cellType(self):
        return self.ct


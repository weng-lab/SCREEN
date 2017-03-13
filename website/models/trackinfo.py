import re

from common.colors_trackhub import GetTrackColorByAssay

class TrackInfo:
    def __init__(self, ct, tissue, assay, expID, fileID):
        self.ct = ct
        self.tissue = tissue
        self.assay = assay
        self.expID = expID
        self.fileID = fileID

    def __repr__(self):
        return "\t".join([str(x) for x in [self.ct, self.assay]])

    def name(self):
        ret = "_".join([self.ct] + [self.assay])
        ret = re.sub(r'\W+', '', ret)
        return ret

    def color(self):
        return GetTrackColorByAssay(self.assay)

    def cellType(self):
        return self.ct


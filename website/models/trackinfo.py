import re

from common.colors_trackhub import GetTrackColorByAssay

class TrackInfo:
    def __init__(self, rtrm, t, ct, assay, expID, fileID):
        self.rtrm = rtrm
        self.t = t
        self.ct = ct
        self.assay = assay
        self.expID = expID
        self.fileID = fileID

    def __repr__(self):
        return "\t".join([str(x) for x in [self.ct, self.assay, self.rtrm]])

    def name(self):
        ret = "_".join([self.rtrm[0]] + [self.assay])
        ret = re.sub(r'\W+', '', ret)
        return ret

    def color(self):
        return GetTrackColorByAssay(self.assay)

    def cellType(self):
        return self.ct


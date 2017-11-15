class Track(object):
    def lines(self):
        return ""

    
class Tracks(object):
    def __init__(self):
        self.tracks = []

    def addExpBestBigWig(self, exp):
        t = Track()
        self.tracks.append(t)

    def lines(self):
        for t in self.tracks:
            for line in t.lines():
                yield line

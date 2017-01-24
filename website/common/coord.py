class Coord:
    def __init__(self, chrom, start, end):
        self.chrom = chrom
        self.start = start
        self.end = end

    def __repr__(self):
        return "{chrom}:{start}-{end}".format(chrom=self.chrom,
                                              start=self.start,
                                              end=self.end)

    def resize(self, halfWindow):
        # 1-based coords for UCSC Genome Browser
        self.start = str(max(1, int(self.start) - halfWindow))
        self.end = str(int(self.end) + halfWindow)
        
    def toDict(self):
        return {"chrom": self.chrom, "start": self.start, "end": self.end}

    @classmethod
    def parse(cls, loci):
        if loci.startswith("chr") and ":" not in loci:
            chrom = loci
            start = 0
            end = 500000000
            return cls(chrom, start, end)
        try:
            toks = loci.split(':')
            chrom = toks[0]
            start = int(toks[1].split('-')[0])
            end = int(toks[1].split('-')[1])
            if not chrom.startswith("chr"): chrom = "chr" + chrom
            return cls(chrom, start, end)
        except:
            return None

    def expanded(self, halfWindow):
        s = max(0, self.start - halfWindow)
        e = self.end + halfWindow
        return Coord(self.chrom, s, e)

    def expandFromCenter(self, halfWindow):
        center = float(self.end - self.start) / 2 + self.start
        s = max(0, center - halfWindow)
        e = center + halfWindow
        return Coord(self.chrom, int(s), int(e))

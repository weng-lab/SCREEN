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

    @classmethod
    def parse(cls, loci):
        try:
            toks = loci.split(':')
            chrom = toks[0]
            start = int(toks[1].split('-')[0])
            end = int(toks[1].split('-')[1])
            print "!", chrom
            if not chrom.startswith("chr"): chrom = "chr" + chrom
            return cls(chrom, start, end)
        except:
            return None


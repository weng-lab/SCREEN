class TrackInfo:
    def __init__(self, cache, ct, tissue, assay, expID, fileID):
        self.cache = cache
        self.ct = ct
        self.tissue = tissue
        self.assay = assay
        self.expID = expID
        self.fileID = fileID

        self.assays  = {"dnase" : "DNase",
                        "h3k27ac" : "H3k27ac",
                        "h3k4me3" : "H3K4me3",
                        "ctcf" : "CTCF"}

    def __repr__(self):
        return "\t".join([str(x) for x in [self.ct, self.assay]])

    def name(self):
        a = self.assay
        if a in self.assays:
            a = self.assays[a]
        ret = " ".join([self.fileID, self.ct, a])
        return ret

    def hex_to_rgb(self, value):
        # http://stackoverflow.com/a/214657
        """Return (red, green, blue) for the color given as #rrggbb."""
        value = value.lstrip('#')
        lv = len(value)
        rgb = tuple(int(value[i:i + lv // 3], 16) for i in range(0, lv, lv // 3))
        return ','.join([str(x) for x in rgb])
    
    def color(self):
        tcs = self.cache.colors["trackhub"]
        if self.assay in tcs:
            return self.hex_to_rgb(tcs[self.assay])
        return None

    def cellType(self):
        return self.ct


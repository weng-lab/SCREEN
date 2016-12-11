import gzip

class Cytoband:
    def __init__(self, fnp):
        _open = open if not fnp.endswith(".gz") else gzip.open
        self.bands = {}
        with _open(fnp, "r") as f:
            for line in f:
                p = line.strip().split("\t")
                if p[0] not in self.bands:
                    self.bands[p[0]] = []
                if "gpos" in p[4]:
                    self.bands[p[0]].append({"start": int(p[1]),
                                             "end": int(p[2]),
                                             "feature": p[4],
                                             "color": float(p[4].replace("gpos", "")) / 100.0 })
                else:
                    self.bands[p[0]].append({"start": int(p[1]),
                                             "end": int(p[2]),
                                             "feature": p[4] })
                

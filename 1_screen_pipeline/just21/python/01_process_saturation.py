import sys

import scipy.stats
import json

class Saturation:
    def __init__(self, path):
        with open(path, "r") as f:
            self._sets = {int(line.split("\t")[0]): [int(x) for x in line.strip().split("\t")[1].split(",")]
                          for line in f }
    def write(self, path):
        results = {}
        for k, v in self._sets.iteritems():
            s = scipy.stats.gaussian_kde(v, 'silverman')
            results[k] = {
                "values": list(s.evaluate(range(min(v), max(v), 100))),
                "domain": [min(v), max(v)],
                "step": 100
            }
        with open(path, "wb") as o:
            o.write(json.dumps(results))
    def estimate_total(self):
        values = []
        for k, v in self._sets.iteritems():
            values += v
        shape, _, scale = scipy.stats.weibull_min.fit(values, floc = 0)
        return scipy.stats.weibull_min.ppf(0.999, shape, scale = scale)

def main():
    print(Saturation("/data/projects/cREs/hg19/saturation.tsv").estimate_total())
    print(Saturation("/data/projects/cREs/hg38/saturation.tsv").estimate_total())
    print(Saturation("/data/projects/cREs/hg38/saturation.encode+cistrome.tsv").estimate_total())
    print(Saturation("/data/projects/cREs/hg38/saturation.encode.tsv").estimate_total())
    Saturation("/data/projects/cREs/hg19/saturation.tsv").write("/data/projects/cREs/hg19/saturation.json")
    Saturation("/data/projects/cREs/hg38/saturation.tsv").write("/data/projects/cREs/hg38/saturation.json")
    return 0

if __name__ == "__main__":
    sys.exit(main())

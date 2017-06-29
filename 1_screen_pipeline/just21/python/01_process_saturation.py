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

def main():
    Saturation("/data/projects/cREs/hg19/saturation.tsv").write("/data/projects/cREs/hg19/saturation.json")
    return 0

if __name__ == "__main__":
    sys.exit(main())

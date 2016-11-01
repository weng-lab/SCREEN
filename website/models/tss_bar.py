import os, sys

class TSSBarGraph:
    def __init__(self, histogram, interval = 1):
        self.histogram = histogram
        self.interval = interval

    def rebin(self, new_bins):
        new_bins.append(1e12)
        for k in new_bins:
            if k != 1e12 and k % self.interval != 0:
                raise Exception("cannot rebin histogram: original bins do not align with new bins")
        retval = {k: 0 for k in new_bins}
        for v in self.histogram["buckets"]:
            for nbi in new_bins:
                if nbi > v["key"]:
                    retval[nbi] += v["doc_count"]
                    break
        keys = sorted([k for k, v in retval.iteritems()])
        return [{"key": k, "value": retval[k]} for k in keys]

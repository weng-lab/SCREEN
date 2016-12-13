import scipy
import scipy.stats
from numpy import *

class Correlation:
    def __init__(self, hits):
        self.hits = hits

    def spearmanr(self, outerkey, innerkey = None, _ctfilter = None):
        if len(self.hits) == 0: return ([], [[], []])
        ctlabels = [ct for ct, v in self.hits[0]["_source"]["ranks"][outerkey].iteritems()
                    if innerkey is None or innerkey in v and (_ctfilter is None or _ctfilter(ct))]
        observations = []
        for result in self.hits:
            result = result["_source"]
            observations.append([])
            for cell_type in ctlabels:
                if outerkey not in result["ranks"]: continue
                if innerkey is not None and innerkey not in result["ranks"][outerkey][cell_type]: continue
                if innerkey is not None:
                    value = result["ranks"][outerkey][cell_type][innerkey]["rank"]
                else:
                    value = result["ranks"][outerkey][cell_type]["rank"]
                observations[-1].append(value)
        return (ctlabels, scipy.stats.spearmanr(observations))

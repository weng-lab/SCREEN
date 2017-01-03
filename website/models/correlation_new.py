
import scipy
import scipy.stats
from numpy import *

def _bpearson(_2da):
    _len = len(_2da)
    rm = [[0.0 for i in xrange(0, _len)] for j in xrange(0, _len)]
    pv = [[0.0 for i in xrange(0, _len)] for j in xrange(0, _len)]
    for i in xrange(_len):
        for j in range(i, _len):
            print(_2da[i])
            print(_2da[j])
            r = scipy.stats.pearsonr(_2da[i], _2da[j])
            rm[i][j], pv[i][j] = r
            rm[j][i], pv[j][i] = r
    return (rm, pv)

class Correlation:
    
    modes = {"spearman": (scipy.stats.spearmanr, "rank"),
             "pearson": (_bpearson, "z-score")}
    
    def __init__(self, hits):
        self.hits = hits
        
    def _correlate_generic(self, outerkey, mode="spearman", innerkey = None, _ctfilter = None):

        if mode not in Correlation.modes:
            print("WARNING: invalid mode %s passed to correlator" % mode)
            return ([], [[], []])
        _cf, ifield = Correlation.modes[mode]
        
        if len(self.hits) == 0:
            return ([], [[], []])
        
        ctlabels = []
        for ct, v in self.hits[0]["_source"]["ranks"][outerkey].iteritems():
            if (innerkey is None or innerkey in v) and (_ctfilter is None or _ctfilter(ct)):
                ctlabels.append(ct)
        if not ctlabels:
            print("ERROR: Correlation: spearman: no ct labels")
            return None, None

        _obs = {}
        observations = []
        ctl = []
        for i in xrange(len(ctlabels)):
            cell_type = ctlabels[i]
            for result in self.hits:
                result = result["_source"]
                if outerkey not in result["ranks"]:
                    continue
                if innerkey is not None and innerkey not in result["ranks"][outerkey][cell_type]:
                    continue
                if innerkey is not None:
                    value = result["ranks"][outerkey][cell_type][innerkey][ifield]
                else:
                    value = result["ranks"][outerkey][cell_type][ifield]
                if ctlabels[i] not in _obs: _obs[ctlabels[i]] = []
                _obs[ctlabels[i]].append(value)
        for k, v in _obs.iteritems():
            ctl.append(k)
            observations.append(v)
        return (ctl, _cf(observations))
    
    def spearmanr(self, outerkey, innerkey = None, _ctfilter = None):
        return self._correlate_generic(outerkey, "spearman", innerkey, _ctfilter)
    
    def pearsonr(self, outerkey, innerkey = None, _ctfilter = None):
        return self._correlate_generic(outerkey, "pearson", innerkey, _ctfilter)

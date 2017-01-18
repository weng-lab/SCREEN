import sys
import scipy
import scipy.stats
from numpy import *

sys.path.append("../../../metadata/utils")
from db_utils import getcursor

def _bpearson(_2da):
    _len = len(_2da)
    rm = [[0.0 for i in xrange(0, _len)] for j in xrange(0, _len)]
    pv = [[0.0 for i in xrange(0, _len)] for j in xrange(0, _len)]
    for i in xrange(_len):
        for j in range(i, _len):
            r = scipy.stats.pearsonr(_2da[i], _2da[j])
            rm[i][j], pv[i][j] = r
            rm[j][i], pv[j][i] = r
    return (rm, pv)

class Correlation:
    def __init__(self, hits, DBCONN = None):
        self.hits = hits
        self.DBCONN = DBCONN

    def dbcorr(self, assembly, assay):
        assay = assay.replace("-", "_").replace("+", "_")
        with getcursor(self.DBCONN, "Correlation::dbcorr") as curs:
            curs.execute("""SELECT correlations FROM correlations_{assembly}
                            WHERE assay = '{assay}'""".format(assembly = assembly, assay = assay))
            r = curs.fetchone()[0]
        return r
        
    def _get_ctlabels(self, outerkey, innerkey = None, _ctfilter = None):
        if len(self.hits) == 0:
            return []
        ctlabels = []
        for ct, v in self.hits[0]["_source"]["ranks"][outerkey].iteritems():
            if (innerkey is None or innerkey in v) and (_ctfilter is None or _ctfilter(ct)):
                ctlabels.append(ct)
        return ctlabels
        
    def spearmanr(self, outerkey, innerkey = None, _ctfilter = None):
        ctlabels = self._get_ctlabels(outerkey, innerkey, _ctfilter)
        if not ctlabels:
            print("ERROR: no ctlabels for Spearman Correlation")
            return (ctlabels, [[], []])
        observations = []
        for result in self.hits:
            result = result["_source"]
            observations.append([])
            for cell_type in ctlabels:
                if outerkey not in result["ranks"]:
                    continue
                if innerkey is not None and innerkey not in result["ranks"][outerkey][cell_type]:
                    continue
                if innerkey is not None:
                    value = result["ranks"][outerkey][cell_type][innerkey]["rank"]
                else:
                    value = result["ranks"][outerkey][cell_type]["rank"]
                observations[-1].append(value)
        return (ctlabels, scipy.stats.spearmanr(observations))

    def pearsonr(self, outerkey, innerkey = None, _ctfilter = None):
        ctlabels = self._get_ctlabels(outerkey, innerkey, _ctfilter)
        if not ctlabels:
            print("ERROR: no ctlabels for Pearson Correlation")
            return (ctlabels, [[], []])
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
                if innerkey is None:
                    value = result["ranks"][outerkey][cell_type]["signal"]
#                elif "Only" in innerkey:
#                    value = result["ranks"][outerkey][cell_type][innerkey][innerkey.split("-")[0].lower()]["signal"]
                else:
                    value = result["ranks"][outerkey][cell_type][innerkey]["z-score"]
                print(value)
                if ctlabels[i] not in _obs: _obs[ctlabels[i]] = []
                _obs[ctlabels[i]].append(value)
        for k, v in _obs.iteritems():
            ctl.append(k)
            observations.append(v)
        print("!got observations")
        return (ctl, _bpearson(observations))
    

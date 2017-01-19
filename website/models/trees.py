import sys
import os

from correlation import Correlation

sys.path.append(os.path.join(os.path.dirname(__file__), "../../heatmaps/API"))
from heatmaps.heatmap import Heatmap

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer

class Trees:
    def __init__(self, cache, pg, assembly, tree_rank_method):
        self.cache = cache
        self.pg = pg
        self.assembly = assembly
        self.tree_rank_method = tree_rank_method

        if "dnase" == tree_rank_method:
            self.inner = None
            self.outer = "dnase"
        else:
            toks = tree_rank_method.split('$')
            self.inner = toks[1]
            self.outer = toks[0]

    def getTree(self):
        ret = {}
        biosampleTypes = self.cache.biosampleTypes
        for typ in biosampleTypes:
            ret[typ] = self._processTyp(typ)
        title = ' / '.join([x for x in [self.outer, self.inner] if x])
        return {"trees": ret, "title" : title }

    def _processTyp(self, typ):
        def ctFilter(ct):
            if not ct in self.cache.biosamples:
                print("missing", ct)
                return False
            return typ == self.cache.biosamples[ct].biosample_type

        c = Correlation(self.assembly, self.pg.DBCONN)

        with Timer(typ + ": spearman correlation time"):
            if self.assembly == "hg19":
                raise Exception("fix me")
            else:
                k = "dnase" if self.inner is None else self.inner.lower()
                labels = self.cache.rankMethodToCellTypes[k]
                labels, corr = c.dbcorr(self.assembly, k, labels,
                                        lambda x: "bryo" in x)
                print("!got correlation")

        if not labels:
            return []

        if 2 == len(corr):
            rho = corr[0]
        else:
            rho = corr

        try:
            if type(rho) is not list:
                rhoList = rho.tolist()
            else:
                rhoList = rho
            _heatmap = Heatmap(rhoList)
        except:
            print("rho", rho)
            print("pval", pval)
            return []
        with Timer(typ + ": hierarchical clustering time"):
            roworder, rowtree = _heatmap.cluster_by_rows()
        return {"tree": rowtree, "labels": labels}


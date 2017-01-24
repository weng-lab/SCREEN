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

        self.groups = {"hg19": [("tissue", lambda x: "tissue" in x and "fetal" in x),
                                ("immortalized", lambda x: "immortalized" in x),
                                ("primary_cell", lambda x: "primary_cell" in x) ]}

    def getTree(self):
        ret = {}
        biosampleTypes = self.cache.biosampleTypes
        if self.assembly == "hg19":
            biosampleTypes = self.groups["hg19"]
        for typ in biosampleTypes:
            idx = typ if type(typ) is str else typ[0]
            ret[idx] = self._processTyp(typ)

        titleLookup = {"DNase" : "DNase",
                       "H3K27ac" : "Enhancer / H3K27ac only",
                       "H3K4me3" :"Promoter / H3K4me3 only",
                       "Enhancer" : "Enhancer / DNase+H3K27ac",
                       "Promoter" : "Promoter / DNase + H3K4me3",
                       "Insulator" : "Insulator / DNase + CTCF",
                       "CTCF" : "Insulator / CTCF only"}
        title = titleLookup[self.tree_rank_method]

        return {"trees": ret, "title" : title }

    def _processTyp(self, typ):
        def ctFilter(ct):
            if not ct in self.cache.biosamples:
                print("missing", ct)
                return False
            return typ[1](ct) #(self.cache.biosamples[ct].biosample_type)

        c = Correlation(self.assembly, self.pg.DBCONN, self.cache)

        k = self.tree_rank_method + "_v10"
        labels = self.cache.rankMethodToCellTypes[self.tree_rank_method]

        if self.assembly == "hg19":
            labels, corr = c.dbcorr(self.assembly, k, labels, typ[1])
        else:
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
            #print("rho", rho)
            #print("pval", pval)
            return []
        with Timer("tree hierarchical clustering time"):
            roworder, rowtree = _heatmap.cluster_by_rows()
        return {"tree": rowtree, "labels": labels}


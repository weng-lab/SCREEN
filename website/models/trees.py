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

    def getTree(self):
        biosampleTypes = self.cache.biosampleTypes
        ret = {}
        for typ in biosampleTypes:
            tree = self._processTyp(typ)
            if tree:
                ret[typ] = tree

        if "hg19" == self.assembly:
            typ = "tissue"
            fil = lambda ct: "fetal" in ct
            tree = self._processTyp(typ, fil)
            if tree:
                ret["fetal " + typ] = tree

        if "mm10" == self.assembly:
            typ = "tissue"
            fil = lambda ct: "embryo" in ct
            tree = self._processTyp(typ, fil)
            if tree:
                ret["embryonic " + typ] = tree
                            
        titleLookup = {"DNase" : "DNase",
                       "H3K27ac" : "Enhancer / H3K27ac only",
                       "H3K4me3" :"Promoter / H3K4me3 only",
                       "Enhancer" : "Enhancer / DNase+H3K27ac",
                       "Promoter" : "Promoter / DNase + H3K4me3",
                       "Insulator" : "Insulator / DNase + CTCF",
                       "CTCF" : "Insulator / CTCF only"}
        title = titleLookup[self.tree_rank_method]

        return {"trees": ret, "title" : title }

    def _processTyp(self, typ, fil = None):
        c = Correlation(self.assembly, self.pg.DBCONN, self.cache)

        tableName = self.tree_rank_method + "_v10"
        cellTypes = self.cache.rankMethodToCellTypes[self.tree_rank_method]

        cellTypesInBiosamType = self.cache.datasets.biosampleTypeToCellTypes[typ]
        cellTypes = set(cellTypes).intersection(set(cellTypesInBiosamType))
        cellTypes = sorted(list(cellTypes))

        if fil:
            cellTypes = filter(fil, cellTypes)
        
        labels, corr = c.dbcorr(self.assembly, tableName, cellTypes)
        if not labels:
            return None, None

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
        return {"tree": rowtree, "labels": labels, "numCellTypes": len(cellTypes)}


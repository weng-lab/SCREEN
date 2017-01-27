import sys, os

from common.page_info_gwas import PageInfoGwas
from models.gwas import Gwas

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from common.pg import PGsearch

class GwasController:
    def __init__(self, templates, es, ps, cacheW):
        self.t = templates
        self.es = es
        self.ps = ps
        self.cacheW = cacheW
        self.params = (es, ps, cacheW)

    def gwas(self, args, kwargs, uuid):
        pageInfo = PageInfoGwas(*self.params)
        return self.t('main/gwas', **pageInfo.gwasPage(args, kwargs, uuid))

    def gwasJson(self, j):
        assembly = j["GlobalAssembly"]
        cache = self.cacheW[assembly]

        gwas_study = j["gwas_study"]
        g = Gwas(cache, PGsearch(self.ps, assembly))

        def form(v):
            return [["%s%% overlap w/ CREs" % v, v],
                    ["", 100 - v]]
        if gwas_study == "Speedy-24292274-Chronic lymphocytic leukemia":
            pie = form(36)
            table = [["Tissue", "-Log(FDR)"],
                     ["CD4+ Helper T cells", 8.78],
                     ["GM12878", 7.56],
                     ["Regulatory T cells", 6.70],
                     ["DND-41", 5.16],
                     ["Natural Killer Cells", 5.06]]
        elif gwas_study == "Surakka-25961943-Cholesterol":
            pie = form(77)
            table = [["Tissue", "-Log(FDR)"],
                     ["HepG2", 1.53],
                     ["Liver", 0.95],
                     ["Large Intestine", 0.03],
                     ["CD4+ Monocytes", 0.03],
                     ["Adrenal Gland", 0.03]]
        elif gwas_study == "Arking-24952745-QT Interval":
            pie = form(93)
            table = [["Tissue", "-Log(FDR)"],
                     ["HepG2", 1.53],
                     ["Liver", 0.95],
                     ["Large Intestine", 0.03],
                     ["CD4+ Monocytes", 0.03],
                     ["Adrenal Gland", 0.03]]
        else:
            v = g.overlapWithCres(gwas_study)
            pie = form(v * 100)
            table = [["Tissue", "-Log(FDR)"]]
        return {gwas_study : {"pie" : pie,
                              "table" : table}}

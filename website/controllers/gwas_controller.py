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

        if gwas_study == "Speedy-24292274-Chronic lymphocytic leukemia":
            ret = [["overlap", 0.3584158415841584],
                   ["noOverlap", 0.6415841584158416]]
        elif gwas_study == "Surakka-25961943-Cholesterol":
            ret = [["overlap", 0.3046800382043935],
                   ["noOverlap", 0.6953199617956065]]
        else:
            perc = g.overlapWithCres(gwas_study)
            ret = [["overlap", perc],
                   ["noOverlap", 1 - perc]]
        return {gwas_study : ret}

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

        return {gwas_study : {"overlap" : g.overlapWithCres(gwas_study)}}

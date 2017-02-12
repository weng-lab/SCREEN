import sys, os

from common.page_info_gwas import PageInfoGwas
from models.gwas import Gwas

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from common.pg_gwas import PGgwas

class GwasController:
    def __init__(self, templates, ps, cacheW):
        self.t = templates
        self.ps = ps
        self.cacheW = cacheW
        self.params = (ps, cacheW)

    def gwas(self, args, kwargs, uuid):
        pageInfo = PageInfoGwas(*self.params)
        return self.t('main/gwas', **pageInfo.gwasPage(args, kwargs, uuid))

    def gwasJson(self, j):
        assembly = j["GlobalAssembly"]
        cache = self.cacheW[assembly]

        gwas_study = j["gwas_study"]
        g = Gwas(assembly, cache, PGgwas(self.ps, assembly))

        def form(v):
            return [["%s%% of LD blocks overlap w/ CREs" % v, v, 0],
                    ["", 100 - v, v]]
        header = ["Cell type", "-log(fdr)"]

        overlapPerc = round(g.overlapWithCresPerc(gwas_study) *100, 2)
        pie = form(overlapPerc)
        table, accs = g.gwasEnrichment(gwas_study)

        return {gwas_study :
                {"pie" : pie,
                 "table" : {"header" : header,
                            "rows" : table},
                 "accs" : accs}}

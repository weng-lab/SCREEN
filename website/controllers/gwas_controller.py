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

    def _mainTableInfo(self, g, gwas_study):
        return {"totalLDblocks" : g.totalLDblocks(gwas_study),
                "numLdBlocksOverlap" : g.numLdBlocksOverlap(gwas_study),
                "numCresOverlap" : g.numCresOverlap(gwas_study) }

    def _main(self, j):
        assembly = j["GlobalAssembly"]
        cache = self.cacheW[assembly]
        g = Gwas(assembly, self.ps, cache)
        gwas_study = j["gwas_study"]
        if not g.checkStudy(gwas_study):
            raise Exception("invalid study")

        return {gwas_study : {"gwas_study" : g.byStudy[gwas_study],
                              "mainTable" : [self._mainTableInfo(g, gwas_study)],
                              "topCellTypes" : g.topCellTypes(gwas_study)}}

    def _cres(self, j):
        assembly = j["GlobalAssembly"]
        cache = self.cacheW[assembly]
        g = Gwas(assembly, self.ps, cache)
        gwas_study = j["gwas_study"]
        if not g.checkStudy(gwas_study):
            raise Exception("invalid study")
        ct = j["cellType"]

        cres = g.cres(gwas_study, ct)
        for cre in cres["accessions"]:
            print(cre)
        return {ct : cres}

    def gwasJson(self, j, args, kwargs):
        if not args:
            raise Exception("unknown action")
        if "main" == args[0]:
            return self._main(j)
        if "cres" == args[0]:
            return self._cres(j)

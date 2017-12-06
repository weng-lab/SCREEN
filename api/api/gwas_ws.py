import sys
import os

from models.gwas import Gwas

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from common.pg_gwas import PGgwas

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from config import Config


class GwasWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeWS(assembly):
            return GwasWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.wss = {a: makeWS(a) for a in self.assemblies}

    def process(self, args, kwargs):
        assembly = kwargs["assembly"]
        if assembly not in self.assemblies:
            raise Exception("invalid assembly")
        return self.wss[assembly].process(*args, **kwargs)


class GwasWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly

        self.actions = {"search": self._initialLoad,
                        "main": self._mainTable,
                        "cres": self._cres}

    def process(self, *args, **kwargs):
        action = kwargs["data"]
        if action not in self.actions:
            raise Exception("gwas_ws: invalid action: " + action)

        try:
            return self.actions[action](args[1:], **kwargs)
        except:
            raise

    def _initialLoad(self, *args, **kwargs):
        g = Gwas(self.assembly, self.ps, self.assembly)
        return {"gwas": {"studies": g.studies,
                         "byStudy": g.byStudy},
                "gwas_study": "",
                "ct": "",
                "assembly": self.assembly}

    def _mainTable(self, *args, **kwargs):
        g = Gwas(self.assembly, self.ps, self.cache)
        self.gwas_study = kwargs["gwas_study"]
        if not g.checkStudy(self.gwas_study):
            raise Exception("invalid gwas study")

        return g.mainTable(self.gwas_study)

    def _cres(self, args):
        g = Gwas(self.assembly, self.ps, self.cache)
        self.gwas_study = kwargs["gwas_study"]
        if not g.checkStudy(self.gwas_study):
            raise Exception("invalid gwas study")

        ct = j["cellType"]
        # TODO: check ct!

        return g.cres(self.gwas_study, ct)

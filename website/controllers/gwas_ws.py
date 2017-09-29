import sys, os

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
        self.wss = {a : makeWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.wss[j["assembly"]].process(j, args, kwargs)

class GwasWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly

        self.actions = {"search" : self._initialLoad,
                        "main": self._mainTable,
                        "cres": self._cres}

    def process(self, j, args, kwargs):
        action = args[0]
        if action not in self.actions:
            raise Exception("gwas_ws: invalid action: " + action)
        
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def _initialLoad(self, j, args):
        g = Gwas(self.assembly, self.ps, self.assembly)
        return {"gwas": {"studies" : g.studies,
                         "byStudy" : g.byStudy}}
        
    def _mainTable(self, j, args):
        g = Gwas(self.assembly, self.ps, self.cache)
        self.gwas_study = j["gwas_study"]
        if not g.checkStudy(gwas_study):
            raise Exception("invalid gwas study")

        return g.mainTable(self.gwas_study)
    
    def _cres(self, j, args):
        g = Gwas(self.assembly, self.ps, self.cache)
        self.gwas_study = j["gwas_study"]
        if not g.checkStudy(gwas_study):
            raise Exception("invalid gwas study")

        ct = j["cellType"]
        # TODO: check ct!

        return g.cres(self.gwas_study, ct)


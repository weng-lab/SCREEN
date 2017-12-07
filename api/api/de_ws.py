import sys
import os

from models.de import DE

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from common.pg import PGsearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from config import Config


class DeWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeWS(assembly):
            return DeWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.wss = {a: makeWS(a) for a in self.assemblies}

    def process(self, args, kwargs):
        assembly = kwargs["assembly"]
        if assembly not in self.assemblies:
            raise Exception("invalid assembly")
        return self.wss[assembly].process(*args, **kwargs)

    
class DeWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly

        self.actions = {"search": self.search}

    def process(self, *args, **kwargs):
        action = kwargs["data"]
        if action not in self.actions:
            raise Exception("gwas_ws: invalid action: " + action)

        try:
            return self.actions[action](args[1:], **kwargs)
        except:
            raise

    def search(self, *args, **kwargs):
        gene = kwargs["gene"]  # TODO: check for valid gene

        ct1 = kwargs["ct1"]
        ct2 = kwargs["ct2"]
        if not ct1 or not ct2:
            raise Exception("ct1 and/or ct2 empty!")

        try:
            de = DE(self.cache, self.ps, self.assembly, gene, ct1, ct2)
            nearbyDEs = de.nearbyDEs()

            diffCREs = {"data": None}
            if nearbyDEs["data"]:
                diffCREs = de.diffCREs(nearbyDEs["xdomain"])

            return {gene: {"xdomain": nearbyDEs["xdomain"],
                           "coord": de.coord().toDict(),
                           "diffCREs": diffCREs,
                           "nearbyDEs": nearbyDEs},
                    "assembly": self.assembly,
                    "gene": gene,
                    "ct1": ct1,
                    "ct2": ct2}
        except:
            raise
            return {}

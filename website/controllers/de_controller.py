import sys, os

from common.page_info_de import PageInfoDe
from models.de import DE

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from common.pg import PGsearch

class DeController:
    def __init__(self, templates, ps, cacheW):
        self.t = templates
        self.ps = ps
        self.cacheW = cacheW
        self.params = (ps, cacheW)

    def de(self, args, kwargs, uuid):
        pageInfo = PageInfoDe(*self.params)
        return self.t('main/de', **pageInfo.dePage(args, kwargs, uuid))

    def deGeneJson(self, j):
        assembly = j["GlobalAssembly"]
        gene = j["gene"] # TODO: check for valid gene

        ct1 = j["ct1"]
        ct2 = j["ct2"]
        if not ct1 or not ct2:
            raise Exception("ct1 and/or ct2 empty!")

        cache = self.cacheW[assembly]

        try:
            return self._getDEs(assembly, gene, ct1, ct2, cache)
        except:
            raise
            return {}

    def _getDEs(self, assembly, gene, ct1, ct2, cache):
        de = DE(cache, self.ps, assembly, gene, ct1, ct2)
        diffCREs = de.diffCREs()
        nearbyDEs = de.nearbyDEs()

        return {gene : {"xdomain" : nearbyDEs["xdomain"],
                        "coord" : de.coord().toDict(),
                        "diffCREs": diffCREs,
                        "nearbyDEs": nearbyDEs}}

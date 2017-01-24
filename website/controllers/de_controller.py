import sys, os

from common.page_info_de import PageInfoDe
from models.de import DE

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from common.pg import PGsearch

class DeController:
    def __init__(self, templates, es, ps, cacheW):
        self.t = templates
        self.es = es
        self.ps = ps
        self.cacheW = cacheW
        self.params = (es, ps, cacheW)

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
        de = DE(cache, PGsearch(self.ps, assembly), gene, ct1, ct2)
        diffCREs = de.diffCREs()
        nearbyDEs = de.nearbyDEs()

        return {gene : {"diffCREs": diffCREs,
                        "nearbyDEs": nearbyDEs}}

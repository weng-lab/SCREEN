import sys, os

from common.page_info_de import PageInfoDe

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))

class DeController:
    def __init__(self, templates, es, ps, cache):
        self.t = templates
        self.es = es
        self.ps = ps
        self.cache = cache
        self.params = (es, ps, cache)

    def de(self, args, kwargs, uuid):
        pageInfo = PageInfoDe(*self.params)
        return self.t('main/de', **pageInfo.dePage(args, kwargs, uuid))

    def geneexpjson(self, j):
        assembly = "mm10"

        gene = j["geneID"]
        # TODO: check for valid gene

        compartments = j["compartments"]
        compartments = filter(lambda x: x["key"] in Compartments, compartments)
        compartments = filter(lambda x: x["selected"], compartments)
        compartments = [x["key"] for x in compartments]
        if not compartments:
            return {"items" : [] }

        cge = ComputeGeneExpression(self.es, self.ps, self.cache, assembly)
        return cge.computeHorBars(gene, compartments)

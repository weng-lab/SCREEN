import sys, os

from common.page_info_geneexp import PageInfoGeneExp

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from compute_gene_expression import ComputeGeneExpression, Compartments

class GeneExpController:
    def __init__(self, templates, es, ps, cache):
        self.t = templates
        self.es = es
        self.ps = ps
        self.cache = cache
        self.params = (es, ps, cache)

    def geneexp(self, args, kwargs, uuid):
        pageInfo = PageInfoGeneExp(*self.params)
        return self.t('main/geneexp', **pageInfo.geneexpPage(args, kwargs, uuid))
    
    def geneexpjson(self, j):
        gene = j["geneID"]
        # TODO: check for valid gene

        compartments = j["compartments"]
        compartments = filter(lambda x: x["key"] in Compartments, compartments)
        compartments = filter(lambda x: x["selected"], compartments)
        compartments = [x["key"] for x in compartments]
        if not compartments:
            return {"items" : [] }

        cge = ComputeGeneExpression(self.es, self.ps, self.cache)
        return cge.computeHorBars(gene, compartments)

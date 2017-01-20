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
        if "GlobalAssembly" not in j:
            raise Exception("GlobalAssembly not defined")
        if j["GlobalAssembly"] not in ["mm10", "hg19"]:
            raise Exception("invalid GlobalAssembly")

        assembly = j["GlobalAssembly"]
        gene = j["gene"] # TODO: check for valid gene
        compartments = j["compartments_selected"]
        if not compartments:
            return {"items" : [] }
        # TODO: check valie compartments

        cge = ComputeGeneExpression(self.es, self.ps, self.cache, assembly)
        return cge.computeHorBars(gene, compartments)

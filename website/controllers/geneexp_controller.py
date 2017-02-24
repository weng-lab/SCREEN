import sys, os

from common.page_info_geneexp import PageInfoGeneExp

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from compute_gene_expression import ComputeGeneExpression, Compartments

class GeneExpController:
    def __init__(self, templates, ps, cache):
        self.t = templates
        self.ps = ps
        self.cache = cache
        self.params = (ps, cache)

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
        biosample_types_selected = j["biosample_types_selected"]
        # TODO: check value of compartments, biosample_types_selected

        if not biosample_types_selected or not compartments:
            return {"hasData" : False, "items" : {}}

        cge = ComputeGeneExpression(self.ps, self.cache, assembly)
        return cge.computeHorBars(gene, compartments, biosample_types_selected)

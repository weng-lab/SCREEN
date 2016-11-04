import sys, os

from common.page_info_geneexp import PageInfoGeneExp
from common.session import Sessions

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from compute_gene_expression import ComputeGeneExpression

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

    def geneexpjson(self, args, kwargs):
        gene = ""
        if "q" in kwargs:
            gene = kwargs["q"]
            # TODO: check gene

        cge = ComputeGeneExpression(self.es, self.ps, self.cache)
        return cge.compute(gene)



from __future__ import print_function
import sys, os

from common.page_info_geneexp import PageInfoGeneExp
from models.gene_expression import GeneExpression

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from config import Config

class GeneExpController:
    def __init__(self, templates, ps, cacheW):
        self.t = templates
        self.ps = ps
        self.cacheW = cacheW
        self.params = (ps, cacheW)
        self.assemblies = Config.assemblies

    def geneexp(self, args, kwargs, uuid):
        pageInfo = PageInfoGeneExp(*self.params)
        return self.t('main/geneexp', **pageInfo.geneexpPage(args, kwargs, uuid))

    def geneexpjson(self, j):
        if "GlobalAssembly" not in j:
            raise Exception("GlobalAssembly not defined")
        if j["GlobalAssembly"] not in self.assemblies:
            raise Exception("invalid GlobalAssembly")

        assembly = j["GlobalAssembly"]
        gene = j["gene"] # TODO: check for valid gene
        compartments = j["compartments_selected"]
        biosample_types_selected = j["biosample_types_selected"]
        # TODO: check value of compartments, biosample_types_selected

        if not biosample_types_selected or not compartments:
            return {"hasData" : False, "items" : {}}

        cache = self.cacheW[assembly]
        cge = GeneExpression(self.ps, cache, assembly)
        return cge.computeHorBars(gene, compartments, biosample_types_selected)

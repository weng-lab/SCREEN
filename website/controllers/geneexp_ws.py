from __future__ import print_function
import sys, os

from common.page_info_geneexp import PageInfoGeneExp
from models.gene_expression import GeneExpression

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from config import Config

class GeneExpWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeWS(assembly):
            return GeneExpWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.wss = {a : makeWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.wss[j["assembly"]].process(j, args, kwargs)

class GeneExpWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly

        self.actions = {"search" : self.search}

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def search(self, j, args):
        gene = j["gene"] # TODO: check for valid gene
        compartments = j.get("compartments_selected", ["cell"])

        allBiosampleTypes = ["immortalized cell line", "induced pluripotent stem cell line",
                             "in vitro differentiated cells", "primary cell", "stem cell", "tissue"]
        biosample_types_selected = j.get("biosample_types_selected", allBiosampleTypes)

        # TODO: check value of compartments, biosample_types_selected

        if not biosample_types_selected or not compartments:
            return {"hasData" : False, "items" : {}}

        cge = GeneExpression(self.ps, self.cache, self.assembly)
        ret = cge.computeHorBars(gene, compartments, biosample_types_selected)
        ret["assembly"] = self.assembly
        return ret

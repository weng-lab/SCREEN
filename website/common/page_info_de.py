import sys, os, json

from compute_gene_expression import ComputeGeneExpression, Compartments

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle

class PageInfoDe:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, assembly, indexPage = False):
        cache = self.cacheW[assembly]
        return {"page": {"title" : PageTitle},
                "indexPage": indexPage,
                "reAccessions" : [],
                "Assembly" : assembly,
                "re_json_index" : paths.reJsonIndex(assembly),
                "globalSessionUid" : "",
                "globalTfs" : [],
                "globalCellCompartments" : [],
                "globalCellTypes" : [],
                "globalCellTypeInfo": cache.globalCellTypeInfo(),
                "globalCellTypeInfoArr": cache.globalCellTypeInfoArr()
                }

    def dePage(self, args, kwargs, uuid):
        assembly = ""
        gene = ""
        if len(args):
            assembly = args[0]
            gene = args[1]
            # TODO: check gene

        cache = self.cacheW[assembly]

        ret = self.wholePage(assembly)
        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene}) })
        return ret


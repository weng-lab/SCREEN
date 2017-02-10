import sys, os, json, cherrypy

from compute_gene_expression import ComputeGeneExpression, Compartments

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle

class PageInfoGeneExp:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, assembly, indexPage = False):
        bundleFnp = os.path.join(os.path.dirname(__file__),
                                 "../ui/dist/bundle.js")
        return {"page": {"title" : PageTitle(assembly)},
                "indexPage": indexPage,
                "reAccessions" : [],
                "Assembly" : assembly,
                "re_json_index" : paths.reJsonIndex(assembly),
                "globalSessionUid" : "",
                "bundlets" : os.path.getmtime(bundleFnp)
        }

    def geneexpPage(self, args, kwargs, uuid):
        assembly = ""
        gene = ""
        if len(args):
            assembly = args[0]
            gene = args[1]
            # TODO: check gene

        ret = self.wholePage(assembly)
        cache = self.cacheW[assembly]

        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene})})

        cellcs = Compartments
        ret.update({"cellCompartments" : json.dumps(cellcs),
                    "globalCellCompartments" : json.dumps(cellcs),
                    "globalCellTypeInfo": cache.globalCellTypeInfo(),
                    "globalCellTypeInfoArr": cache.globalCellTypeInfoArr()
                    })

        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene})})
        return ret


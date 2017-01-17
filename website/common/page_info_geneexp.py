import sys, os, json, cherrypy
import subprocess

from compute_gene_expression import ComputeGeneExpression, Compartments

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle

class PageInfoGeneExp:
    def __init__(self, es, ps, cacheW):
        self.es = es
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, assembly, indexPage = False):
        return {"page": {"title" : PageTitle},
                "indexPage": indexPage,
                "reAccessions" : [],
                "Assembly" : assembly,
                "re_json_index" : paths.reJsonIndex(assembly),
                "globalSessionUid" : "",
                "globalTfs" : [],
                "globalCellTypes" : []
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

        cellcs = [{"key" : c, "selected" : True} for c in Compartments]
        ret.update({"cellCompartments" : json.dumps(cellcs),
                    "globalCellCompartments" : json.dumps(cellcs),
                    "globalCellTypeInfo": cache.globalCellTypeInfo(),
                    "globalCellTypeInfoArr": cache.globalCellTypeInfoArr()
                    })

        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene})})
        return ret


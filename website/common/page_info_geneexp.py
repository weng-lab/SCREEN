import sys, os, json, cherrypy
import subprocess

from compute_gene_expression import ComputeGeneExpression, Compartments

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths

class PageInfoGeneExp:
    def __init__(self, es, ps, cache):
        self.es = es
        self.ps = ps
        self.cache = cache

    def wholePage(self, indexPage = False):
        return {"page": {"title" : "Regulatory Element Visualizer"},
                "indexPage": indexPage,
                "reAccessions" : [],
                "re_json_index" : paths.re_json_index,
                "globalSessionUid" : "",
                "globalTfs" : [],
                "globalCellTypes" : []
        }
    
    def geneexpPage(self, args, kwargs, uuid):
        ret = self.wholePage()

        gene = ""
        if len(args):
            gene = args[0]
            # TODO: check gene

        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene})})

        cellcs = [{"key" : c, "selected" : True} for c in Compartments]
        ret.update({"cellCompartments" : json.dumps(cellcs),
                    "globalCellCompartments" : json.dumps(cellcs)})

        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene})})
        return ret
    

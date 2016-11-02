import sys, os, json, cherrypy
import subprocess

from compute_gene_expression import ComputeGeneExpression
from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from parse_search import ParseSearch

from common.session import Sessions

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from autocomplete import Autocompleter
from constants import paths

class PageInfoGeneExp:
    def __init__(self, es, ps, cache):
        self.es = es
        self.ps = ps
        self.cache = cache
        self.regElements = RegElements(es)
        self.regElementDetails = RegElementDetails(es, ps)

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

        parsed = ""
        if "q" in kwargs:
            gene = kwargs["q"]
        # TODO: check gene

        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene})})
        
        cge = ComputeGeneExpression(self.es, self.ps, self.cache)
        ge = cge.compute(gene)

        ret.update(ge)
        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene})})

        cellcs = [{"value" : "cell"},
                  {"value" : "nucleoplasm"},
                  {"value" : "cytosol"},
                  {"value" : "nucleus"},
                  {"value" : "membrane"},
                  {"value" : "chromatin"},
                  {"value" : "nucleolus"}]
        ret.update({"cellCompartments" : json.dumps(cellcs),
                    "globalCellCompartments" : json.dumps(cellcs)})
                
        return ret
    

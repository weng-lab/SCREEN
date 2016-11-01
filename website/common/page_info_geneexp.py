import sys, os, json, cherrypy
import subprocess

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
                "re_json_index" : paths.re_json_index
        }

    def geneexpPage(self, args, kwargs, uuid):
        retval = self.wholePage()

        parsed = ""
        if "q" in kwargs:
            p = ParseSearch(kwargs["q"], self.es)
            parsed = p.parse()
            parsedStr = p.parseStr()

        retval.update({"globalParsedQuery" : json.dumps(parsed),
                       "globalSessionUid" : uuid,
                       "globalTfs" : self.cache.tf_list_json,
                       "globalCellTypes" : self.cache.cellTypesAndTissues_json,
                       "searchPage": True,
                       "tissueMap": self.cache.tissueMap })

        return retval
    

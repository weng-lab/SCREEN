import sys, os, json, cherrypy
import subprocess

from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from parse_search import ParseSearch

from common.session import Sessions

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths

class PageInfoComparison:
    def __init__(self, es, ps, cache):
        self.es = es
        self.ps = ps
        self.cache = cache
        self.regElements = RegElements(es)
        self.regElementDetails = RegElementDetails(es, ps)

    def wholePage(self, indexPage = False):
        return {"page": {"title" : "Regulatory Element Visualizer - cell type comparison"},
                "indexPage": indexPage,
                "reAccessions" : [],
                "re_json_index" : paths.re_json_index
        }

    def comparisonPage(self, args, kwargs, uuid):
        retval = self.wholePage()

        parsed = ""
        if "q" in kwargs:
            p = ParseSearch(kwargs["q"], self.es)
            parsed = p.parse(comparison=True)
            parsedStr = p.parseStr()

        retval.update({"globalParsedQuery": json.dumps(parsed),
                       "globalSessionUid": uuid,
                       "globalTfs": json.dumps({}),
                       "globalCellTypes": self.cache.cellTypesAndTissues_json,
                       "searchPage": False,
                       "tissueMap": self.cache.tissueMap })

        return retval
    

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

    def wholePage(self, assembly, indexPage = False):
        return {"page": {"title" : "Regulatory Element Visualizer - cell type comparison"},
                "indexPage": indexPage,
                "reAccessions" : [],
                "Assembly" : assembly,
                "re_json_index" : paths.reJsonIndex(assembly)
        }

    def comparisonPage(self, args, kwargs, uuid):
        if "assembly" not in kwargs:
            raise Exception("assembly not found" + str(kwargs))
        assembly = kwargs["assembly"]
        ret = self.wholePage(assembly)

        parsed = ""
        if "q" in kwargs:
            p = ParseSearch(kwargs["q"], self.es)
            parsed = p.parse(comparison=True)
            parsedStr = p.parseStr()

        ret.update({"globalParsedQuery": json.dumps(parsed),
                    "globalSessionUid": uuid,
                    "globalTfs": json.dumps({}),
                    "globalCellTypes" : self.cache.getCTTjson(assembly),
                    "searchPage": False,
                    "tissueMap": self.cache.getTissue(assembly) })

        return ret
    

import sys, os, json

from parse_search import ParseSearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle

class PageInfoComparison:
    def __init__(self, es, ps, cacheW):
        self.es = es
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, assembly, indexPage = False):
        cache = self.cacheW[assembly]
        return {"page": {"title" : PageTitle},
                "indexPage": indexPage,
                "reAccessions" : [],
                "Assembly" : assembly,
                "re_json_index" : paths.reJsonIndex(assembly),
                "globalTfs" : [],
                "globalCellCompartments" : [],
                "globalCellTypes" : [],
                "globalCellTypeInfo": cache.globalCellTypeInfo(),
                "globalCellTypeInfoArr": cache.globalCellTypeInfoArr()

        }

    def comparisonPage(self, args, kwargs, uuid):
        assembly = ""
        if len(args):
            assembly = args[0]
            # TODO: check gene
        else:
            raise Exception("no assembly")
        
        cache = self.cacheW[assembly]

        ret = self.wholePage(assembly)

        parsed = ""
        if "q" in kwargs:
            p = ParseSearch(kwargs["q"], self.es)
            parsed = p.parse(comparison=True)
            parsedStr = p.parseStr()

        ret.update({"globalParsedQuery": json.dumps(parsed),
                    "globalSessionUid": uuid,
                    "searchPage": False,
                    "tissueMap" : json.dumps({})
                    })

        return ret
    

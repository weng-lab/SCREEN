import sys, os, json, cherrypy

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle

class PageInfoTf:
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
                "globalSessionUid" : "",
                "globalTfs" : [],
                "globalCellCompartments" : [],
                "globalCellTypes" : [],
                "globalCellTypeInfo": cache.globalCellTypeInfo(),
                "globalCellTypeInfoArr": cache.globalCellTypeInfoArr()
                }

    def tfPage(self, args, kwargs, uuid):
        assembly = ""
        if len(args):
            assembly = args[0]

        cache = self.cacheW[assembly]

        ret = self.wholePage(assembly)
        ret.update({"globalParsedQuery" : json.dumps({}) })
        return ret


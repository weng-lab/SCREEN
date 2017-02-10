import sys, os, json, cherrypy

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle

class PageInfoTf:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, assembly, indexPage = False):
        bundleFnp = os.path.join(os.path.dirname(__file__),
                                 "../ui/dist/bundle.js")
        return {"page": {"title" : PageTitle},
                "indexPage": indexPage,
                "reAccessions" : [],
                "Assembly" : assembly,
                "re_json_index" : paths.reJsonIndex(assembly),
                "globalSessionUid" : "",
                "bundlets" : os.path.getmtime(bundleFnp)
                }

    def tfPage(self, args, kwargs, uuid):
        assembly = ""
        if len(args):
            assembly = args[0]

        cache = self.cacheW[assembly]

        ret = self.wholePage(assembly)
        ret.update({"globalParsedQuery" : json.dumps({}) })
        return ret


import sys, os, json

from parse_search import ParseSearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle

class PageInfoComparison:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, assembly, indexPage = False):
        bundleFnp = os.path.join(os.path.dirname(__file__),
                                 "../ui/dist/bundle.js")
        cssFnp = os.path.join(os.path.dirname(__file__),
                              "../static/css.css")
        return {"page": {"title" : PageTitle(assembly)},
                "indexPage": indexPage,
                "Assembly" : assembly,
                "bundlets" : os.path.getmtime(bundleFnp),
                "cssts" : os.path.getmtime(cssFnp)
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
            p = ParseSearch(kwargs["q"])
            parsed = p.parse(comparison=True)
            parsedStr = p.parseStr()

        ret.update({"globalParsedQuery": json.dumps(parsed),
                    "globalSessionUid": uuid,
                    "searchPage": False,
                    "tissueMap" : json.dumps({})
                    })

        return ret


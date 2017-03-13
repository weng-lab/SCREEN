import sys, os, json

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle
from config import Config

class PageInfoDe:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, assembly, indexPage = False):
        bundleFnp = os.path.join(os.path.dirname(__file__),
                                 "../ui/dist/bundle.js")
        cssFnp = os.path.join(os.path.dirname(__file__),
                              "../static/css.css")
        return {"page": {"title" : PageTitle(assembly)},
                "Ribbon": Config.ribbon,
                "indexPage": indexPage,
                "Assembly" : assembly,
                "bundlets" : os.path.getmtime(bundleFnp),
                "cssts" : os.path.getmtime(cssFnp)
                }

    def dePage(self, args, kwargs, uuid):
        assembly = ""
        gene = ""
        if len(args):
            assembly = args[0]
            gene = kwargs["gene"]
            # TODO: check gene

        cache = self.cacheW[assembly]

        ret = self.wholePage(assembly)
        ret.update({"globalParsedQuery" : json.dumps({"gene" : gene}) })
        return ret


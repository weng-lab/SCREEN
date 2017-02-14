import sys, os, json, cherrypy
import subprocess

from models.gwas import Gwas
from common.pg_gwas import PGgwas

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle

class PageInfoGwas:
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

    def gwasPage(self, args, kwargs, uuid):
        assembly = ""
        if len(args):
            assembly = args[0]

        cache = self.cacheW[assembly]
        g = Gwas(assembly, self.ps, assembly)

        data = {"gwas": {"studies" : g.studies}}

        ret = self.wholePage(assembly)
        ret.update({"globalParsedQuery" : json.dumps({}),
                    "GwasGlobals" : json.dumps(data)
        })

        return ret


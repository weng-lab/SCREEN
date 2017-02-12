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
        return {"page": {"title" : PageTitle(assembly)},
                "indexPage": indexPage,
                "Assembly" : assembly,
                "bundlets" : os.path.getmtime(bundleFnp)
                }

    def gwasPage(self, args, kwargs, uuid):
        assembly = ""
        if len(args):
            assembly = args[0]

        cache = self.cacheW[assembly]
        g = Gwas(assembly, cache, PGgwas(self.ps, assembly))

        data = {"gwas": {"gwas" : g.gwas,
                         "studies" : g.studies}}

        ret = self.wholePage(assembly)
        ret.update({"globalParsedQuery" : json.dumps({}),
                    "GwasGlobals" : json.dumps(data)
        })

        return ret


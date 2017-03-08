from __future__ import print_function

import sys, os, json

from parse_search import ParseSearch
from pg_cart import PGcart

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle, chrom_lengths

class PageInfoSearch:
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

    def haveresults(self, parsed):
        return parsed["coord_chrom"] or (parsed["accessions"] and len(parsed["accessions"])) or parsed["cellType"]

    def searchPage(self, args, kwargs, uuid):
        if "assembly" not in kwargs:
            raise Exception("assembly not found" + str(kwargs))
        assembly = kwargs["assembly"]
        ret = self.wholePage(assembly)

        parsed = ""
        if "q" in kwargs:
            p = ParseSearch(self.ps.DBCONN, assembly, kwargs)
            parsed = p.parse()
            if kwargs["q"] and not self.haveresults(parsed):
                ret["failed"] = kwargs["q"]

        cart = PGcart(self.ps, assembly)
        accessions = cart.get(uuid)

        parsed["cart_accessions"] = accessions
        if "cart" in kwargs:
            parsed["accessions"] = accessions

        cache = self.cacheW[assembly]

        ret.update({"globalParsedQuery" : json.dumps(parsed),
                    "globalSessionUid" : uuid,
                    "searchPage": True
                    })

        return ret

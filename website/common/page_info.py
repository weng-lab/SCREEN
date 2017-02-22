import sys, os, json, cherrypy

from parse_search import ParseSearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from autocomplete import Autocompleter
from constants import paths, PageTitle, chrom_lengths

class PageInfoMain:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self):
        bundleFnp = os.path.join(os.path.dirname(__file__),
                                 "../ui/dist/bundle.js")
        cssFnp = os.path.join(os.path.dirname(__file__),
                              "../static/css.css")
        return {"page": {"title" : PageTitle("")},
                "Assembly" : None,
                "bundlets" : os.path.getmtime(bundleFnp),
                "cssts" : os.path.getmtime(cssFnp)
        }

    def autocomplete(self, userQuery):
        ac = Autocompleter(self.es)
        return ac.get_suggestions(userQuery)

    def setCart(self, uuid, reAccessions):
        return self.ps.addToCart(uuid, reAccessions)

import sys, os, json, cherrypy

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import PageTitle
from config import Config

class PageInfoMain:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, userQueryErr):
        bundleFnp = os.path.join(os.path.dirname(__file__),
                                 "../ui/dist/bundle.js")
        cssFnp = os.path.join(os.path.dirname(__file__),
                              "../static/css.css")
        return {"page": {"title" : PageTitle("")},
                "Ribbon": Config.ribbon,
                "Assembly" : None,
                "userQueryErr" : userQueryErr,
                "bundlets" : os.path.getmtime(bundleFnp),
                "cssts" : os.path.getmtime(cssFnp)
        }

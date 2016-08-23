#!/usr/bin/python

import cherrypy, jinja2, os, sys

from controllers.ui.ui import UiController

from timeit import default_timer as timer

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates
from utils import Utils

class UiApp():
    def __init__(self, viewDir, staticDir, es, ps, version, webSocketUrl):
        self.templates = Templates(viewDir, staticDir)
        self.uic = UiController(self.templates, es, ps, version, webSocketUrl)

    @cherrypy.expose
    def default(self):
        return self.uic.Default()
        
class UiAppRunner:
    def __init__(self, es, ps, devMode, webSocketUrl, config):
        version = '/'.join(["ver4", "ui"])
        if not devMode:
            version = '/'.join(["regElmViz", "ver4", "ui"])

        d = os.path.dirname(__file__)
        staticDir = os.path.abspath(os.path.join(d, "static", "ui"))
        Utils.mkdir_p(staticDir)
        viewDir = os.path.abspath(os.path.join(d, "views"))

        config.update({
            '/static': {
                'tools.staticdir.on': True,
                'tools.staticdir.dir': staticDir
            }
        })
        
        server = UiApp(viewDir, staticDir, es, ps, version, webSocketUrl)

        cherrypy.tree.mount(server,
                            "/" + '/'.join(["ver4", "ui"]),
                            config = config)

#!/usr/bin/python

import cherrypy, jinja2, os, sys

from controllers.main.main import MainController

from timeit import default_timer as timer

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates

class MainApp():
    def __init__(self, viewDir, staticDir, es, DBCONN, version, webSocketUrl):
        self.templates = Templates(viewDir, staticDir)
        self.mc = MainController(self.templates, es, DBCONN, version, webSocketUrl)

    @cherrypy.expose
    def index(self):
        return self.mc.Index()

    @cherrypy.expose
    def query(self, q=None, url=None):
        return self.mc.RawQuery(q, url)

    @cherrypy.expose
    def overlap(self, chrom, start, end):
        return self.mc.Overlap(chrom, int(start), int(end))

    @cherrypy.expose
    def search(self, *args, **kwargs):
        return self.mc.search(args, kwargs)

    @cherrypy.expose
    def hexplot(self, *args, **kwargs):
        return self.mc.HexplotView(args, kwargs)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def reDetail(self, reAccession, cellType = None):
        return self.mc.reDetail(reAccession, cellType)

class MainAppRunner:
    def __init__(self, es, DBCONN, devMode, webSocketUrl):
        version = '/'.join(["ver4", "search"])
        if not devMode:
            version = '/'.join(["regElmViz", "ver4", "search"])

        d = os.path.dirname(__file__)
        staticDir = os.path.abspath(os.path.join(d, "static"))
        viewDir = os.path.abspath(os.path.join(d, "views"))

        config = {
            '/static': {
                'tools.staticdir.on': True,
                'tools.staticdir.dir': staticDir
                }
            }

        server = MainApp(viewDir, staticDir, es, DBCONN, version, webSocketUrl)

        cherrypy.tree.mount(server,
                            "/" + '/'.join(["ver4", "search"]),
                            config = config)

#!/usr/bin/python

import cherrypy, jinja2, os

from timeit import default_timer as timer

from templates import Templates
from controllers.main.index import MainController

class MainApp():
    def __init__(self, viewDir, DBCONN, species, version):
        self.templates = Templates(viewDir)
        self.mc = MainController(self.templates, DBCONN, species, version)

    @cherrypy.expose
    def index(self):
        return self.mc.Index()

    @cherrypy.expose
    def query(self, q=None, url=None):
        return self.mc.Query(q, url)

class MainAppRunner:
    def __init__(self, DBCONN, devMode, species):
        version = '/'.join([species, "main"])

        d = os.path.dirname(__file__)
        staticDir = os.path.abspath(os.path.join(d, "static"))
        viewDir = os.path.abspath(os.path.join(d, "views"))

        config = {
            '/static': {
                'tools.staticdir.on': True,
                'tools.staticdir.dir': staticDir
                }
            }

        server = MainApp(viewDir, DBCONN, species, version)

        cherrypy.tree.mount(server, "/" + version, config = config)

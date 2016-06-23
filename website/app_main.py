#!/usr/bin/python

import cherrypy, jinja2, os, sys

from controllers.main.index import MainController

from timeit import default_timer as timer

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates

class MainApp():
    def __init__(self, viewDir, DBCONN, species, version):
        self.templates = Templates(viewDir)
        self.mc = MainController(self.templates, DBCONN, species, version)

    @cherrypy.expose
    def index(self):
        return self.mc.Index()

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

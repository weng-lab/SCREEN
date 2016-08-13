#!/usr/bin/python

import cherrypy, jinja2, os, sys

from controllers.main.main import MainController
from controllers.main.trackhub import TrackhubController

from timeit import default_timer as timer

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates

class MainApp():
    def __init__(self, viewDir, staticDir, es, ps, version, webSocketUrl):
        self.templates = Templates(viewDir, staticDir)
        self.mc = MainController(self.templates, es, ps, version, webSocketUrl)
        self.trackhub = TrackhubController(self.templates, es, ps,
                                           version, webSocketUrl)
        
    @cherrypy.expose
    def index(self):
        return self.mc.Index()

    @cherrypy.expose
    def ucsc_trackhub(self, *args, **kwargs):
        return self.trackhub.ucsc_trackhub(args, kwargs)

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
    def element(self, accession):
        return self.mc.element(accession)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def reDetail(self, reAccession, **kwargs):
        return self.mc.reDetail(reAccession, kwargs)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def rePeaks(self, reAccession, **kwargs):
        return self.mc.rePeaks(reAccession, kwargs)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def reSNPs(self, reAccession, **kwargs):
        return self.mc.reSNPs(reAccession, kwargs)

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def autocomplete(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.mc.autocomplete(j)

class MainAppRunner:
    def __init__(self, es, ps, devMode, webSocketUrl, config):
        version = '/'.join(["ver4", "search"])
        if not devMode:
            version = '/'.join(["regElmViz", "ver4", "search"])

        d = os.path.dirname(__file__)
        staticDir = os.path.abspath(os.path.join(d, "static"))
        viewDir = os.path.abspath(os.path.join(d, "views"))

        config.update({
            '/static': {
                'tools.staticdir.on': True,
                'tools.staticdir.dir': staticDir
            }
        })

        server = MainApp(viewDir, staticDir, es, ps, version, webSocketUrl)

        cherrypy.tree.mount(server,
                            "/" + '/'.join(["ver4", "search"]),
                            config = config)

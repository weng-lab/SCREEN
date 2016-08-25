#!/usr/bin/python

import cherrypy, jinja2, os, sys

from controllers.main.main import MainController
from controllers.main.trackhub import TrackhubController
from controllers.main.cart import CartController
from common.session import Sessions

from timeit import default_timer as timer

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates

class MainApp():
    def __init__(self, viewDir, staticDir, es, ps, webSocketUrl):
        self.templates = Templates(viewDir, staticDir)
        self.mc = MainController(self.templates, es, ps, webSocketUrl)
        self.cartc = CartController(self.templates, es, ps, webSocketUrl)
        self.trackhub = TrackhubController(self.templates, es, ps,
                                           webSocketUrl)
        self.sessions = Sessions(ps.DBCONN)

    def session_uuid(self):
        uid = self.sessions.get(cherrypy.session.id)
        if not uid:
            uid = self.sessions.makeUid()
            cherrypy.session["uid"] = uid
            self.sessions.insert(cherrypy.session.id, uid)
        return uid

    @cherrypy.expose
    def index(self):       
        return self.mc.Index()

    @cherrypy.expose
    def ucsc_trackhub(self, *args, **kwargs):
        return self.trackhub.ucsc_trackhub(args, kwargs,
                                           self.session_uuid())

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def washu_trackhub(self, *args, **kwargs):
        return self.trackhub.washu_trackhub(args, kwargs,
                                            self.session_uuid())

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
    @cherrypy.tools.json_out()
    def autocomplete(self, *args, **kwargs):
        return self.mc.autocomplete(kwargs["userQuery"])

    @cherrypy.expose
    def cart(self):
        return self.cartc.Cart(self.session_uuid())
    
    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def setCart(self):
        j = cherrypy.request.json
        return self.cartc.SetCart(self.session_uuid(), j)


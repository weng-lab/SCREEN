#!/usr/bin/python

import cherrypy, jinja2, os, sys

from controllers.main_controller import MainController
from controllers.geneexp_controller import GeneExpController
from controllers.de_controller import DeController
from controllers.gwas_controller import GwasController
from controllers.global_data_controller import GlobalDataController
from controllers.tf_controller import TfController
from controllers.trackhub import TrackhubController
from controllers.cart import CartController
from controllers.data_ws import DataWebServiceWrapper
from controllers.comparison import ComparisonController

from common.session import Sessions

from timeit import default_timer as timer

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates

class MainApp():
    def __init__(self, args, viewDir, staticDir, ps, cache):
        self.templates = Templates(viewDir, staticDir)
        self.mc = MainController(self.templates, ps, cache)
        self.ge = GeneExpController(self.templates, ps, cache)
        self.de = DeController(self.templates, ps, cache)
        self.gwas = GwasController(self.templates, ps, cache)
        self.global_data = GlobalDataController(ps, cache)
        self.tf = TfController(self.templates, ps, cache)
        self.cp = ComparisonController(self.templates, ps, cache)
        self.cartc = CartController(self.templates, ps, cache)
        self.trackhub = TrackhubController(self.templates, ps, cache)
        self.dataWS = DataWebServiceWrapper(args, ps, cache, staticDir)
        self.sessions = Sessions(ps.DBCONN)

    @cherrypy.expose
    def index(self):
        return self.mc.Index()

    @cherrypy.expose
    def ucsc_trackhub(self, *args, **kwargs):
        return self.trackhub.ucsc_trackhub(args, kwargs,
                                           self.sessions.userUid())

    @cherrypy.expose
    def washu_trackhub(self, *args, **kwargs):
        return self.trackhub.washu_trackhub(self.sessions.userUid(), args, kwargs)

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def ucsc_trackhub_url(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.trackhub.ucsc_trackhub_url(j, self.sessions.userUid())

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def ensembl_trackhub_url(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.trackhub.ensembl_trackhub_url(j, self.sessions.userUid())

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def washu_trackhub_url(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.trackhub.washu_trackhub_url(j, self.sessions.userUid())

    @cherrypy.expose
    def comparison(self, *args, **kwargs):
        return self.cp.comparison(args, kwargs, self.sessions.userUid())

    @cherrypy.expose
    def search(self, *args, **kwargs):
        return self.mc.search(args, kwargs, self.sessions.userUid())

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def autocomplete(self, *args, **kwargs):
        return self.mc.autocomplete(kwargs["userQuery"])

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def setCart(self):
        j = cherrypy.request.json
        return self.cartc.SetCart(self.sessions.userUid(), j)

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def dataws(self, *args, **kwargs):
        #print(cherrypy.request)
        j = cherrypy.request.json
        return self.dataWS.process(j, args, kwargs)

    @cherrypy.expose
    def geneexp(self, *args, **kwargs):
        return self.ge.geneexp(args, kwargs, self.sessions.userUid())

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def geneexpjson(self):
        j = cherrypy.request.json
        return self.ge.geneexpjson(j)

    @cherrypy.expose
    def deGene(self, *args, **kwargs):
        return self.de.de(args, kwargs, self.sessions.userUid())

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def deGeneJson(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.de.deGeneJson(j)

    @cherrypy.expose
    def gwasApp(self, *args, **kwargs):
        return self.gwas.gwas(args, kwargs, self.sessions.userUid())

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def gwasJson(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.gwas.gwasJson(j, args, kwargs)

    @cherrypy.expose
    def tfApp(self, *args, **kwargs):
        return self.tf.tf(args, kwargs, self.sessions.userUid())

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def tfJson(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.tf.tfJson(j)

    @cherrypy.expose
    def globalData(self, assembly, ver):
        return self.global_data.static(assembly, ver)

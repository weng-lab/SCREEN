#!/usr/bin/python

from __future__ import print_function

import cherrypy, jinja2, os, sys

from controllers.main_controller import MainController
from controllers.geneexp_controller import GeneExpController
from controllers.de_controller import DeController
from controllers.gwas_controller import GwasController
from controllers.global_data_controller import GlobalDataController
from controllers.tf_controller import TfController
from controllers.trackhub_controller import TrackhubController
from controllers.cart_ws import CartWebServiceWrapper
from controllers.data_ws import DataWebServiceWrapper
from controllers.autocomplete_controller import AutocompleteWebService
#from controllers.comparison_controller import ComparisonController

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
        #self.cp = ComparisonController(self.templates, ps, cache)
        self.cartWS = CartWebServiceWrapper(ps, cache)
        self.trackhub = TrackhubController(self.templates, ps, cache)
        self.dataWS = DataWebServiceWrapper(args, ps, cache, staticDir)
        self.autoWS = AutocompleteWebService(ps)
        self.sessions = Sessions(ps.DBCONN)

    @cherrypy.expose
    def index(self, *args, **kwargs):
        return self.mc.Index()

    @cherrypy.expose
    def ucsc_trackhub(self, *args, **kwargs):
        return self.trackhub.ucsc_trackhub(*args, **kwargs)

    @cherrypy.expose
    def ensembl_trackhub(self, *args, **kwargs):
        return self.trackhub.ensembl_trackhub(*args, **kwargs)

    @cherrypy.expose
    def washu_trackhub(self, *args, **kwargs):
        return self.trackhub.washu_trackhub(*args, **kwargs)

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def ucsc_trackhub_url(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.trackhub.ucsc_trackhub_url(j, self.sessions.userUid())

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def ucsc_trackhub_url_snp(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.trackhub.ucsc_trackhub_url_snp(j, self.sessions.userUid())

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
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def cart(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.cartWS.process(j, self.sessions.userUid(),
                                   args, kwargs)

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def dataws(self, *args, **kwargs):
        #print(cherrypy.request)
        j = cherrypy.request.json
        return self.dataWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def autows(self, *args, **kwargs):
        #print(cherrypy.request)
        j = cherrypy.request.json
        return self.autoWS.process(j, args, kwargs)

    @cherrypy.expose
    def geApp(self, *args, **kwargs):
        return self.ge.geneexp(args, kwargs, self.sessions.userUid())

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def geneexpjson(self):
        j = cherrypy.request.json
        return self.ge.geneexpjson(j)

    @cherrypy.expose
    def deApp(self, *args, **kwargs):
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

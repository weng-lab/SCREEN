#!/usr/bin/python

from __future__ import print_function

import cherrypy, jinja2, os, sys

from controllers.geneexp_ws import GeneExpWebServiceWrapper
from controllers.de_ws import DeWebServiceWrapper
from controllers.gwas_controller import GwasController
from controllers.global_data_controller import GlobalDataController
from controllers.tf_controller import TfController
from controllers.trackhub_controller import TrackhubController
from controllers.cart_ws import CartWebServiceWrapper
from controllers.data_ws import DataWebServiceWrapper
from controllers.search_ws import SearchWebServiceWrapper
from controllers.autocomplete_controller import AutocompleteWebService
from controllers.intersection_controller import IntersectionController
from controllers.tads_controller import TadsController

from common.session import Sessions

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates

class MainApp():
    def __init__(self, args, viewDir, staticDir, ps, cache):
        self.templates = Templates(viewDir, staticDir)
        self.geWS = GeneExpWebServiceWrapper(args, ps, cache, staticDir)
        self.de_ws = DeWebServiceWrapper(args, ps, cache, staticDir)
        self.tc = TadsController(self.templates, ps, cache)
        self.gwas = GwasController(self.templates, ps, cache)
        self.global_data = GlobalDataController(ps, cache)
        self.tf = TfController(self.templates, ps, cache)
        self.ic = IntersectionController(self.templates, ps, cache)
        self.cartWS = CartWebServiceWrapper(ps, cache)
        self.trackhub = TrackhubController(self.templates, ps, cache)
        self.dataWS = DataWebServiceWrapper(args, ps, cache, staticDir)
        self.autoWS = AutocompleteWebService(ps)
        self.searchWS = SearchWebServiceWrapper(args, ps, cache, staticDir)
        self.sessions = Sessions(ps.DBCONN)

    @cherrypy.expose
    def intersections(self, *args, **kwargs):
        return self.gwas.gwas(args, kwargs, self.sessions.userUid())

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
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def cart(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.cartWS.process(j, self.sessions.userUid(),
                                   args, kwargs)

    @cherrypy.expose
    def tads(self, *args, **kwargs):
        return self.tc.tads(args, kwargs, self.sessions.userUid())

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def searchws(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.searchWS.process(j, args, self.sessions.userUid())

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
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def gews(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.geWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def deGeneJson(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.deWS.process(j, args, kwargs)

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
    def globalData(self, ver, assembly):
        return self.global_data.static(assembly, ver)

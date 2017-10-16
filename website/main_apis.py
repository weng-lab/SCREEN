#!/usr/bin/python

from __future__ import print_function

import cherrypy
import jinja2
import os
import sys

from api.autocomplete_ws import AutocompleteWebService
from api.cart_ws import CartWebServiceWrapper
from api.data_ws import DataWebServiceWrapper
from api.de_ws import DeWebServiceWrapper
from api.gb_ws import GenomeBrowserWebServiceWrapper
from api.geneexp_ws import GeneExpWebServiceWrapper
from api.global_data_ws import GlobalDataController
from api.gwas_ws import GwasWebServiceWrapper
from api.search_ws import SearchWebServiceWrapper
from api.trackhub_ws import TrackhubController
from api.post_ws import PostWebServiceWrapper

from common.session import Sessions


class Apis():
    def __init__(self, args, viewDir, staticDir, ps, cache):
        self.autoWS = AutocompleteWebService(ps)
        self.cartWS = CartWebServiceWrapper(ps, cache)
        self.dataWS = DataWebServiceWrapper(args, ps, cache, staticDir)
        self.deWS = DeWebServiceWrapper(args, ps, cache, staticDir)
        self.geWS = GeneExpWebServiceWrapper(args, ps, cache, staticDir)
        self.gbWS = GenomeBrowserWebServiceWrapper(args, ps, cache, staticDir)
        self.global_data = GlobalDataController(ps, cache)
        self.gwasWS = GwasWebServiceWrapper(args, ps, cache, staticDir)
        self.searchWS = SearchWebServiceWrapper(args, ps, cache, staticDir)
        self.postWS = PostWebServiceWrapper(args, ps, cache, staticDir)
        self.sessions = Sessions(ps.DBCONN)
        self.trackhub = TrackhubController(ps, cache)

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
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def cart(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.cartWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def searchws(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.searchWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def postws(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.postWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def dataws(self, *args, **kwargs):
        # print(cherrypy.request)
        j = cherrypy.request.json
        return self.dataWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def gbws(self, *args, **kwargs):
        # print(cherrypy.request)
        j = cherrypy.request.json
        return self.gbWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def autows(self, *args, **kwargs):
        # print(cherrypy.request)
        j = cherrypy.request.json
        return self.autoWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def gews(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.geWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def dews(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.deWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def gwasws(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.gwasWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    def globalData(self, ver, assembly):
        return self.global_data.static(assembly, ver)

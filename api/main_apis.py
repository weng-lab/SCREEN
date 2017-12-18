#!/usr/bin/python

from __future__ import print_function

import cherrypy
import os
import sys

from api.autocomplete_ws import AutocompleteWebService
from api.cart_ws import CartWebServiceWrapper
from api.data_ws import DataWebServiceWrapper
from api.cre_ws import CreDetailsWebServiceWrapper
from api.bulk_ws import BulkWebServiceWrapper
from api.de_ws import DeWebServiceWrapper
from api.gb_ws import GenomeBrowserWebServiceWrapper
from api.geneexp_ws import GeneExpWebServiceWrapper
from api.global_data_ws import GlobalDataWebServiceWrapper
from api.gwas_ws import GwasWebServiceWrapper
from api.search_ws import SearchWebServiceWrapper
from api.trackhub_ws import TrackhubController
from api.post_ws import PostWebServiceWrapper


class Apis():
    def __init__(self, args, viewDir, staticDir, ps, cache):
        self.autoWS = AutocompleteWebService(ps)
        self.cartWS = CartWebServiceWrapper(ps, cache)
        self.dataWS = DataWebServiceWrapper(args, ps, cache, staticDir)
        self.creDetailsWS = CreDetailsWebServiceWrapper(args, ps, cache, staticDir)
        self.bulkWS = BulkWebServiceWrapper(args, ps, cache, staticDir)
        self.deWS = DeWebServiceWrapper(args, ps, cache, staticDir)
        self.geWS = GeneExpWebServiceWrapper(args, ps, cache, staticDir)
        self.gbWS = GenomeBrowserWebServiceWrapper(args, ps, cache, staticDir)
        self.globalWS = GlobalDataWebServiceWrapper(cache)
        self.gwasWS = GwasWebServiceWrapper(args, ps, cache, staticDir)
        self.searchWS = SearchWebServiceWrapper(args, ps, cache, staticDir)
        self.postWS = PostWebServiceWrapper(args, ps, cache, staticDir)
        self.trackhub = TrackhubController(ps, cache)

    @cherrypy.expose
    def ucsc_trackhub(self, *args, **kwargs):
        return self.trackhub.ucsc_trackhub(*args, **kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def ucsc_trackhub_url(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.trackhub.ucsc_trackhub_url(j, j["uuid"])

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def ucsc_trackhub_url_snp(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.trackhub.ucsc_trackhub_url_snp(j, j["uuid"])

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
        j = cherrypy.request.json
        return self.dataWS.process(j, args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_out()
    def credetails(self, *args, **kwargs):
        return self.creDetailsWS.process(*args, **kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_out()
    def bulkws(self, *args, **kwargs):
        return self.bulkWS.process(args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def gbws(self, *args, **kwargs):
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
    @cherrypy.tools.json_out()
    def de(self, *args, **kwargs):
        return self.deWS.process(args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def gwas(self, *args, **kwargs):
        return self.gwasWS.process(args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    def globalData(self, ver, assembly):
        # TODO: remove me
        return self.globalWS.static(assembly, ver)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_out()
    def globals(self, *args, **kwargs):
        return self.globalWS.process(args, kwargs)

    @cherrypy.expose
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_out()
    def creFiles(self, *args, **kwargs):
        return self.globalWS.creFiles()

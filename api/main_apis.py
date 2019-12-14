#!/usr/bin/python



import cherrypy
import jinja2
import os
import sys
import uuid
import requests

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
        self.trackhub = TrackhubController(ps, cache)
        self.args = args
        self.cache = cache

    @cherrypy.expose
    def hubs(self, *args, **kwargs):
        return requests.get("http://gcp.wenglab.org/hubs/" + '/'.join(args)).text
        
    @cherrypy.expose
    def promoter_like(self, *args, **kwargs):
        return self.category_generic("promoterlike", *args, **kwargs)

    @cherrypy.expose
    def enhancer_like(self, *args, **kwargs):
        return self.category_generic("enhancerlike", *args, **kwargs)

    @cherrypy.expose
    def ctcf_only(self, *args, **kwargs):
        return self.category_generic("ctcfonly", *args, **kwargs)

    @cherrypy.expose
    def active(self, *args, **kwargs):
        return self.category_generic("active", *args, **kwargs)

    @cherrypy.expose
    @cherrypy.tools.json_out()
    def ctlist(self, *args, **kwargs):
        try:
            return list(set([ x for _, x in self.cache[args[0]].accmap.items() ])) # unique CTs
        except:
            raise cherrypy.HTTPError(404)
    
    def category_generic(self, g, *args, **kwargs):
        if 0 == len(args):
            raise cherrypy.HTTPError(404)
        try:
            if 1 == len(args):
                with open(os.path.join(self.args.basedir, "projects", "screen", "Version-4", "ver10", args[0], "CTS_f", "CTA.%s.bed" % g), 'r') as f:
                    return f.read()
            testfile = os.path.join(self.args.basedir, "projects", "screen", "Version-4", "ver10", args[0], "CTS_f", "%s.%s.bed" % (args[1], g))
            if os.path.exists(testfile):
                with open(testfile, 'r') as f:
                    return f.read()
            if args[1] not in self.cache[args[0]].accmap:
                raise cherrypy.HTTPError(404)
            testfile = os.path.join(self.args.basedir, "projects", "screen", "Version-4", "ver10", args[0], "CTS_f", "%s.%s.bed" % (self.cache[args[0]].accmap[args[1]], g))
            if os.path.exists(testfile):
                with open(testfile, 'r') as f:
                    return f.read()
        except:
            pass
        raise cherrypy.HTTPError(404)

    @cherrypy.expose
    def ucsc_trackhub(self, *args, **kwargs):
        return self.trackhub.ucsc_trackhub(*args, **kwargs)

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def ucsc_trackhub_url(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.trackhub.ucsc_trackhub_url(j, j["uuid"] if "uuid" in j else str(uuid.uuid4()))

    @cherrypy.expose
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def ucsc_trackhub_url_snp(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.trackhub.ucsc_trackhub_url_snp(j, j["uuid"] if "uuid" in j else str(uuid.uuid4()))

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def cart(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.cartWS.process(j, args, kwargs)

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def searchws(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.searchWS.process(j, args, kwargs)

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def postws(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.postWS.process(j, args, kwargs)

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def dataws(self, *args, **kwargs):
        # print(cherrypy.request)
        j = cherrypy.request.json
        return self.dataWS.process(j, args, kwargs)

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def gbws(self, *args, **kwargs):
        # print(cherrypy.request)
        j = cherrypy.request.json
        return self.gbWS.process(j, args, kwargs)

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def autows(self, *args, **kwargs):
        # print(cherrypy.request)
        j = cherrypy.request.json
        return self.autoWS.process(j, args, kwargs)

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def gews(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.geWS.process(j, args, kwargs)

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def dews(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.deWS.process(j, args, kwargs)

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_in()
    @cherrypy.tools.json_out()
    def gwasws(self, *args, **kwargs):
        j = cherrypy.request.json
        return self.gwasWS.process(j, args, kwargs)

    @cherrypy.expose
    # @cherrypy.config(**{'tools.cors.on': True})
    def globalData(self, ver, assembly):
        return self.global_data.static(assembly, ver)

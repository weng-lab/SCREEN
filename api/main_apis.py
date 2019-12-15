#!/usr/bin/python



import cherrypy
import jinja2
import os
import sys
import uuid
import requests

from api.cre_ws import CreDetailsWebServiceWrapper
from api.trackhub_ws import TrackhubController

class Apis():
    def __init__(self, args, viewDir, staticDir, ps, cache):
        self.creDetailsWS = CreDetailsWebServiceWrapper(args, ps, cache, staticDir)
        self.trackhub = TrackhubController(ps, cache)
        self.args = args
        self.cache = cache

    @cherrypy.expose
    def hubs(self, *args, **kwargs):
        return requests.get("http://gcp.wenglab.org/hubs/" + '/'.join(args)).text
        
    @cherrypy.expose
    @cherrypy.tools.json_out()
    def ctlist(self, *args, **kwargs):
        try:
            return list(set([ x for _, x in self.cache[args[0]].accmap.items() ])) # unique CTs
        except:
            raise cherrypy.HTTPError(404)

    @cherrypy.expose
    def ucsc_trackhub(self, *args, **kwargs):
        return self.trackhub.ucsc_trackhub(*args, **kwargs)

    @cherrypy.expose
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

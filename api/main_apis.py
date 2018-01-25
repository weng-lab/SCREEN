#!/usr/bin/python

from __future__ import print_function

import cherrypy
import os
import sys

from api.cre_ws import CreDetailsWebServiceWrapper
from api.trackhub_ws import TrackhubController

class Apis():
    def __init__(self, args, viewDir, staticDir, ps, cache):
        self.creDetailsWS = CreDetailsWebServiceWrapper(args, ps, cache, staticDir)
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
    @cherrypy.config(**{'tools.cors.on': True})
    @cherrypy.tools.json_out()
    def credetails(self, *args, **kwargs):
        return self.creDetailsWS.process(*args, **kwargs)


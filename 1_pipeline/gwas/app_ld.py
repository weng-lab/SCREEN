#!/usr/bin/python

from __future__ import print_function

import cherrypy, jinja2, os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from templates import Templates

class SnpApp():
    def __init__(self, args, viewDir, staticDir, ps):
        self.templates = Templates(viewDir, staticDir)
        self.ps = ps

    @cherrypy.expose
    def snp_ld(self, *args, **kwargs):
        return "snp_ld"

    @cherrypy.expose
    def snp_coord(self, *args, **kwargs):
        return "snp_coord"

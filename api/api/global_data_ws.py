from __future__ import print_function
import sys
import os
import cherrypy
import json

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from config import Config


class GlobalDataController:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def static(self, assembly, ver):
        if "index" == assembly:
            files = []
            for assembly in Config.assemblies:
                files += self.cacheW[assembly].filesList
            cherrypy.response.headers['Content-Type'] = 'application/json'
            return json.dumps(files)

        cache = self.cacheW[assembly]
        g = cache.global_data(ver)
        if "0" == ver:
            cherrypy.response.headers['Content-Type'] = 'application/json'
            return json.dumps(g)
        return "var Globals = " + json.dumps(g)

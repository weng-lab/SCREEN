from __future__ import print_function
import sys
import os
import cherrypy
import json

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from config import Config

class GlobalDataWebServiceWrapper:
    def __init__(self, cacheW):
        def makeDWS(assembly):
            return GlobalDataWebService(cacheW[assembly])
        self.cacheW = cacheW
        self.assemblies = Config.assemblies
        self.dwss = {a: makeDWS(a) for a in self.assemblies}

    def static(self, assembly, ver):
        if assembly not in self.assemblies:
            raise Exception("invalid assembly")
        return self.dwss[assembly].static(ver)

    def process(self, args, kwargs):
        assembly = args[0]
        if assembly not in self.assemblies:
            raise Exception("invalid assembly")
        return self.dwss[assembly].process(args[1:], kwargs)

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

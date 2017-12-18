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

    def creFiles(self):
        files = []
        for assembly in Config.assemblies:
            files += self.cacheW[assembly].filesList
        return files

class GlobalDataWebService(object):
    def __init__(self, cache):
        self.cache = cache
        self.globalData = cache.global_data()

    def static(self, ver):
        # TODO: remove me
        g = self.globalData
        if "0" == ver:
            cherrypy.response.headers['Content-Type'] = 'application/json'
            return json.dumps(g)
        return "var Globals = " + json.dumps(g)

    def process(self, args, kwargs):
        r = {}
        g = self.globalData
        for key in args:
            if key not in g:
                return {"error": "key not found", "key": key}
            r[key] = g[key]
        return r

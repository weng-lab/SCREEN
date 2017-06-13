import sys, os, cherrypy, json

class GlobalDataController:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def static(self, assembly, ver):
        if "index" == assembly:
            g = self.cacheW["hg19"].nineState
            g = g.values()
            if "0" == ver:
                cherrypy.response.headers['Content-Type'] = 'application/json'
                return json.dumps(g)
            return "var NineState = " + json.dumps(g)
       
        cache = self.cacheW[assembly]
        g = cache.global_data(ver)
        if "0" == ver:
            cherrypy.response.headers['Content-Type'] = 'application/json'
            return json.dumps(g)
        return "var Globals = " + json.dumps(g)


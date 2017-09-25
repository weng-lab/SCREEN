from __future__ import print_function

import os, sys, json
import time
import cherrypy

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from config import Config
from cre_utils import checkChrom

class SearchWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeSWS(assembly):
            return SearchWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.swss = {a : makeSWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.swss[j["assembly"]].process(j, args, kwargs)

class SearchWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly

        self.actions = {"search" : self.search}
        
    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def search(self, j, args):
        chrom = checkChrom(self.assembly, j)

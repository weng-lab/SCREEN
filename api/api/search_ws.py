
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng



import os
import sys
import json
import time
import cherrypy
import uuid as uuider

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from config import Config
from cre_utils import checkChrom
from parse_search import ParseSearch
from pg_cart import PGcart


class SearchWebServiceWrapper:
    def __init__(self, args, pw, cacheW, staticDir):
        def makeWS(assembly):
            return SearchWebService(args, pw, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.wss = {a: makeWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.wss[j["assembly"]].process(j, args, kwargs)


class SearchWebService(object):
    def __init__(self, args, pw, cache, staticDir, assembly):
        self.args = args
        self.pw = pw
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly

        self.actions = {"search": self.search}

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:], kwargs)
        except:
            raise

    def search(self, j, args, kwargs):
        chrom = checkChrom(self.assembly, j)

        ret = {}
        
        parsed = ""
        if "q" in j:
            p = ParseSearch(self.pw, self.assembly, j)
            parsed = p.parse()
            if j["q"] and not p.haveresults(parsed):
                ret["failed"] = j["q"]

        uuid = j["uuid"]

        cart = PGcart(self.pw, self.assembly)
        accessions = cart.get(uuid)

        parsed["cart_accessions"] = accessions
        if "cart" in j:
            parsed["accessions"] = accessions

        parsed["uuid"] = uuid

        ret = {"parsedQuery": parsed,
               "uuid": uuid}
        return ret

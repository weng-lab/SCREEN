from __future__ import print_function

import os
import sys
import json

from common.pg_cart import PGcart

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import checkAssembly, isaccession
from config import Config


class CartWebServiceWrapper:
    def __init__(self, ps, cacheW):
        def makeCWS(assembly):
            return CartWebService(ps, cacheW[assembly], assembly)
        self.assemblies = Config.assemblies
        self.cwss = {a: makeCWS(a) for a in self.assemblies}

    def process(self, j, uuid, args, kwargs):
        if "GlobalAssembly" not in j:
            raise Exception("GlobalAssembly not defined")
        if j["GlobalAssembly"] not in self.assemblies:
            raise Exception("invalid GlobalAssembly")
        return self.cwss[j["GlobalAssembly"]].process(j, uuid, args, kwargs)


class CartWebService:
    def __init__(self, ps, cache, assembly):
        self.ps = ps
        self.cache = cache
        self.assembly = assembly

        self.cart = PGcart(ps, assembly)
        self.actions = {"set": self.set}

    def process(self, j, uuid, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, uuid, args[1:])
        except:
            raise

    def set(self, j, uuid, args):
        accessions = filter(lambda a: isaccession(a), j["accessions"])
        return self.cart.set(uuid, accessions)

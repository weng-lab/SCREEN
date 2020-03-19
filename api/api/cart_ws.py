
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng



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

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.cwss[j["assembly"]].process(j, args, kwargs)


class CartWebService:
    def __init__(self, ps, cache, assembly):
        self.ps = ps
        self.cache = cache
        self.assembly = assembly

        self.cart = PGcart(ps, assembly)
        self.actions = {"set": self.set}

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:], kwargs)
        except:
            raise

    def set(self, j, args, kwargs):
        uuid = j["uuid"]
        accessions = [a for a in j["accessions"] if isaccession(a)]
        ret = self.cart.set(uuid, accessions)
        return ret

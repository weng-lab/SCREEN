from __future__ import print_function

import os, sys, json

from common.page_info import PageInfoMain
from common.pg_cart import PGcartWrapper

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import checkAssembly

class CartController:
    def __init__(self, templates, ps, cache):
        self.t = templates
        self.cartW = PGcartWrapper(ps)
        self.params = (ps, cache)

        self.actions = {"set" : self.set_cart,
                        "clear" : self.clear_cart}

    def process(self, j, uuid, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, uuid, args[1:])
        except:
            raise
        
    def set_cart(self, j, uuid, args):
        assembly = j["GlobalAssembly"]
        checkAssembly(assembly)
        accessions = j["accessions"]
        cart = self.cartW[assembly]
        return cart.set(uuid, accessions)

    def clear_cart(self, j, uuid, args):
        assembly = j["GlobalAssembly"]
        checkAssembly(assembly)
        cart = self.cartW[assembly]
        return cart.set(uuid, [])

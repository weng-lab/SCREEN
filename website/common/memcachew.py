#!/usr/bin/env python

from __future__ import print_function
import sys
import os
import pylibmc
from contextlib import contextmanager
import hashlib

sys.path.append(os.path.join(os.path.dirname(__file__), "../../metadata/utils"))
from utils import AddPath

AddPath(__file__, "..")
from config import Config

class ClientPool(list):
    # http://sendapatch.se/projects/pylibmc/pooling.html
    @contextmanager
    def reserve(self):
        mc = self.pop()
        try:
            yield mc
        finally:
            self.append(mc)

class MemCacheHelper:
    mc_pool_size = 20

    print("starting memcached client")
    mc = pylibmc.Client(["memcached"], binary=True,
                        behaviors={"tcp_nodelay": True,
                                   "ketama": True})

class MemCacheWrapper:
    # Borg pattern: http://code.activestate.com/recipes/66531/
    __shared_state = {
        "mc_pool" : ClientPool(MemCacheHelper.mc.clone()
                               for i in xrange(MemCacheHelper.mc_pool_size))
        }

    def __init__(self, assembly, subNamespace):
        self.__dict__ = self.__shared_state
        self.namespace = ':'.join(["screen", str(Config.version), assembly,
                                   subNamespace])

    def _key(self, name, *args, **kwargs):
        # http://www.zieglergasse.at/blog/2011/python/memcached-decorator-for-python/
        h = hashlib.md5()
        margs = [x.__repr__() for x in args]
        mkwargs = [x.__repr__() for x in kwargs.values()]
        map(h.update, margs + mkwargs)
        h.update(name)
        h.update(self.namespace)
        return h.hexdigest()

    def getOrSet(self, name, f, *args, **kwargs):
        k = self._key(name, args, kwargs)
        # example use
        with self.mc_pool.reserve() as mc:
            if k in mc:
                return mc[k]
            data = f(*args, **kwargs)
            try:
                mc[k] = data
            except:
                print("could not save", k)
            return data

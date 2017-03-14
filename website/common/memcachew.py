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

class MemCacheWrapperHelper:
    mc_pool_size = 20

    print("starting memcached client")
    mc = pylibmc.Client(["127.0.0.1"], binary=True,
                        behaviors={"tcp_nodelay": True,
                                   "ketama": True})

class MemCacheWrapper:
    __shared_state = {
        "mc_pool" : ClientPool(MemCacheWrapperHelper.mc.clone() for i in xrange(MemCacheWrapperHelper.mc_pool_size)),
        "hash" : hashlib.md5()
        }

    def __init__(self, subnamespace):
        self.__dict__ = self.__shared_state
        self.namespace = "screen" + Config.version + ':' + subnamespace + ':'

    def _key(self, kRaw):
        # http://www.zieglergasse.at/blog/2011/python/memcached-decorator-for-python/
        if isinstance(kRaw, basestring):
            return self.namespace + ':' + str(hash(kRaw))
        return self.namespace + ':' + str(hash(':'.join([str(x) for x in kRaw])))

    def __contains__(self, kRaw):
        with self.mc_pool.reserve() as mc:
            k = self._key(kRaw)
            return k in mc

    def set(self, kRaw, v):
        # memcache has 1MB limit?
        with self.mc_pool.reserve() as mc:
            k = self._key(kRaw)
            try:
                mc[k] = v
            except:
                print("could not save", k)

    def get(self, kRaw):
        with self.mc_pool.reserve() as mc:
            k = self._key(kRaw)
            if k in mc:
                print("mc: got", kRaw)
                return mc[k]

    def getOrSet(self, name, f, *args, **kwargs):
        kRaw = [name] + list(args) + list(kwargs.values())
        # example use
        with self.mc_pool.reserve() as mc:
            k = self._key(kRaw)
            if k in mc:
                return mc[k]
            data = f(*args, **kwargs)
            try:
                mc[k] = v
            except:
                print("could not save", k)
            return data

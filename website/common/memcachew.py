#!/usr/bin/env python

from __future__ import print_function
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../metadata/utils"))
from utils import AddPath

AddPath(__file__, "..")
from config import Config

class MemCacheWrapper:
    def __init__(self, subnamespace):
        self.namespace = "screen" + Config.version + ':' + subnamespace + ':'
        self.mc = None
        try:
            import pylibmc
            self.mc = pylibmc.Client(["127.0.0.1"], binary=True,
                                behaviors={"tcp_nodelay": True,
                                           "ketama": True})
            print("using memcache...", self.namespace)
        except:
            print("pylibmc not found....")
            pass

    def _key(self, kRaw):
        if isinstance(kRaw, basestring):
            return self.namespace + ':' + str(hash(kRaw))
        return self.namespace + ':' + str(hash(':'.join([str(x) for x in kRaw])))

    def __contains__(self, kRaw):
        if self.mc:
            k = self._key(kRaw)
            return k in self.mc
        return False

    def set(self, kRaw, v):
        # memcache has 1MB limit
        if self.mc:
            k = self._key(kRaw)
            try:
                self.mc[k] = v
            except:
                print("could not save", k)

    def get(self, kRaw):
        if self.mc:
            k = self._key(kRaw)
            if k in self.mc:
                return self.mc[k]
        return None

    def getOrSet(self, name, f, *args, **kwargs):
        kRaw = [name] + list(args) + list(kwargs.values())
        # example use
        if self.mc:
            ret = self.get(kRaw)
            if ret:
                return ret
            data = f(*args, **kwargs)
            self.set(kRaw, data)
            return data
        return f()

#!/usr/bin/env python

from __future__ import print_function

import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from utils import AddPath

AddPath(__file__, "..")
from config import Config

class GetOrSetMemCache(object):
    def __init__(self, assembly, subNamespace):
        self.mc = None
        if Config.memcache:
            from memcachew import MemCacheWrapper
            self.mc = MemCacheWrapper(assembly, subNamespace)

    def __getattribute__(self, name):
        # http://stackoverflow.com/a/2704528
        attr = object.__getattribute__(self, name)
        if hasattr(attr, '__call__'):
            def newfunc(*args, **kwargs):
                if self.mc:
                    return self.mc.getOrSet(name, attr, *args, **kwargs)
                return attr(*args, **kwargs)
            return newfunc
        else:
            return attr


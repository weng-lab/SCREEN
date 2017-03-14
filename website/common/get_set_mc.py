#!/usr/bin/env python

from __future__ import print_function

import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from memcachew import MemCacheWrapper

class GetOrSetMemCache(object):
    def __init__(self, assembly, subNamespace):
        self.mc = MemCacheWrapper(assembly, subNamespace)

    def __getattribute__(self, name):
        attr = object.__getattribute__(self, name)
        if hasattr(attr, '__call__'):
            def newfunc(*args, **kwargs):
                return self.mc.getOrSet(name, attr, *args, **kwargs)
            return newfunc
        else:
            return attr


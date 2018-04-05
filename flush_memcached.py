#!/usr/bin/env python

from __future__ import print_function
import sys
import os
import pylibmc

mc = pylibmc.Client(["memcached"], binary=True,
                    behaviors={"tcp_nodelay": True,
                               "ketama": True})
mc.flush_all()
print("flushed")

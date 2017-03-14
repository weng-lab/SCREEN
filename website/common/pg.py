#!/usr/bin/env python

from __future__ import print_function

import sys
import os

from pg_impl import PGsearchImpl

class PGsearchWrapper:
    def __init__(self, pg):
        self.assemblies = Config.assemblies
        self.pgs = {a : PGsearch(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

class PGsearch(PGsearchImpl):
    def __init__(self, pg, assembly):
        PGsearchImpl.__init__(self, pg, assembly)

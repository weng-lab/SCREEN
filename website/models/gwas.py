#!/usr/bin/env python

from __future__ import print_function

from cre import CRE

class Gwas:
    def __init__(self, cache, pgSearch):
        self.cache = cache
        self.pgSearch = pgSearch

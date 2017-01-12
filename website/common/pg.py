#!/usr/bin/env python

class PGsearchWrapper:
    def __init__(self, pg):
        self.pgs = {
            "hg19" : PGsearch(pg, "hg19"),
            "mm10" : PGsearch(pg, "mm10")}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

class PGsearch:
    def __init__(self, pg, assembly):
        self.pg = pg
        self.assembly = assembly

#!/usr/bin/env python

from __future__ import print_function

import sys, os

sys.path.append(os.path.join(os.path.realpath(__file__), ".."))
from pg_autocomplete import PGautocomplete

sys.path.append(os.path.join(os.path.realpath(__file__), "../../metadata/utils"))
from db_utils import getcursor

def _second_onward(arr):
    if len(arr) == 1: return []
    return arr[1:]

class AutocompleterWrapper:
    def __init__(self, ps):
        self.ps = ps
        self.acs = {
            "hg19" : Autocompleter(ps, "hg19"),
            "mm10" : Autocompleter(ps, "mm10")}

    def __getitem__(self, assembly):
        return self.acs[assembly]

    def get_suggestions(self, q):
        p = q.split(" ")

        results = []
        with getcursor(self.ps.DBCONN, "Autocomplete::get_suggestions") as curs:
            for i in xrange(len(p)):
                prefix = " ".join(p[:i])
                suffix = " ".join(p[i:])
                results = self.acs["hg19"].get_suggestions(curs, suffix) + self.acs["mm10"].get_suggestions(curs, suffix)
                if len(results) > 0:
                    results = sorted([prefix + " " + x for x in results])
                    break
            return [q] + results

class Autocompleter:
    def __init__(self, ps, assembly):
        self.assembly = assembly
        self.pgAutocomplete = PGautocomplete(ps, assembly)

    def get_suggestions(self, curs, q):
        uq = q.lower()
        if not uq:
            return []
        return self.pgAutocomplete.get_suggestions(curs, uq)

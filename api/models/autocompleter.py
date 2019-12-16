#!/usr/bin/env python3

import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../common'))
from pg_autocomplete import PGautocomplete

sys.path.append(os.path.join(os.path.dirname(__file__), '../../utils'))
from db_utils import getcursor
from utils import AddPath



def _second_onward(arr):
    if len(arr) == 1:
        return []
    return arr[1:]


class AutocompleterWrapper:
    def __init__(self, ps):
        self.ps = ps
        self.acs = {
            "hg19": Autocompleter(ps, "hg19"),
            "mm10": Autocompleter(ps, "mm10")}

    def __getitem__(self, assembly):
        return self.acs[assembly]

    def get_suggestions(self, q, assemblies=["hg19", "mm10"]):
        p = q.split(" ")

        results = []
        with getcursor(self.ps.DBCONN, "Autocomplete::get_suggestions") as curs:
            for i in range(len(p)):
                prefix = " ".join(p[:i])
                suffix = " ".join(p[i:])
                results = []
                for assembly in assemblies:
                    results += self.acs[assembly].get_suggestions(curs, suffix)
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

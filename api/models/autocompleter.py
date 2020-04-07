#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__),'../common'))
from pg_autocomplete import PGautocomplete


def _second_onward(arr):
    if len(arr) == 1:
        return []
    return arr[1:]


class AutocompleterWrapper:
    def __init__(self, ps):
        self.ps = ps
        self.acs = {
            "GRCh38": Autocompleter(ps, "GRCh38")
        }

    def __getitem__(self, assembly):
        return self.acs[assembly]

    def get_suggestions(self, q, assemblies=["GRCh38"]):
        p = q.split(" ")

        results = []
        for i in range(len(p)):
            prefix = " ".join(p[:i])
            suffix = " ".join(p[i:])
            results = []
            for assembly in assemblies:
                results += self.acs[assembly].get_suggestions(suffix)
            if len(results) > 0:
                results = sorted([prefix + " " + x for x in results])
                break
        return [q] + results


class Autocompleter:
    def __init__(self, ps, assembly):
        self.assembly = assembly
        self.pgAutocomplete = PGautocomplete(ps, assembly)

    def get_suggestions(self, q):
        uq = q.lower()
        if not uq:
            return []
        return self.pgAutocomplete.get_suggestions(uq)

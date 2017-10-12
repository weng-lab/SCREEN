from __future__ import print_function

import os, sys, json
import time
import numpy as np
import cherrypy

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from utils import AddPath

AddPath(__file__, "../models")
from autocompleter import AutocompleterWrapper

AddPath(__file__, "../common")
from parse_search import ParseSearch

class AutocompleteWebService:
    def __init__(self, ps):
        self.ps = ps
        self.ac = AutocompleterWrapper(ps)
        
        self.actions = {"suggestions" : self.suggestions,
                        "search" : self.search}

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def suggestions(self, j, args):
        if "assemblies" not in j:
            return self.ac.get_suggestions(j["userQuery"])
        return self.ac.get_suggestions(j["userQuery"], j["assemblies"])

    def _haveresults(self, parsed):
        return parsed["coord_chrom"] or (parsed["accessions"] and len(parsed["accessions"])) or parsed["cellType"]

    def search(self, j, args):
        if "assembly" not in j:
            raise Exception("assembly not found" + str(j))
        assembly = j["assembly"]
        if "userQuery" not in j:
            raise Exception("userQuery not in j")
        userQuery = j["userQuery"]

        p = ParseSearch(self.ps.DBCONN, assembly, {"q" : userQuery})
        ret = {}
        try:
            ret = p.parse()
            ret["failed"] = False
            if userQuery and not self._haveresults(ret):
                ret["failed"] = True
        except:
            ret["failed"] = True

        return ret


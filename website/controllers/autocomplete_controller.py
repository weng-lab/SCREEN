from __future__ import print_function

import os, sys, json
import time
import numpy as np
import cherrypy

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from autocomplete import AutocompleterWrapper

class AutocompleteWebService:
    def __init__(self, ps):
        self.ac = AutocompleterWrapper(ps)

        self.actions = {"suggestions" : self.suggestions}

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def suggestions(self, j, args):
        return self.ac.get_suggestions(j["userQuery"])

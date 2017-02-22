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

    def process(self, j, args, kwargs):
        return self.ac.get_suggestions(j["userQuery"])

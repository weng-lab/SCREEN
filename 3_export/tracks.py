from __future__ import print_function

import sys
import os
from collections import OrderedDict

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils, eprint, AddPath, printt, printWroteNumLines

import helpers as Helpers

class BigWigTrack(object):
    def __init__(self, assembly, exp, f):
        self.assembly = assembly
        self.exp = exp
        self.f = f
        self.p = self._init()

    def _init(self):
        p = OrderedDict()
        p["desc"] = self._desc()
        p["bigDataUrl"] = self._url()
        p["visibility"] = "dense"
        p["type"] = "bigWig"
        p["color"] = None
        p["height"] = "maxHeightPixels 128:32:8"
        p["visibility"] = "full"
        p["shortLabel"] = Helpers.makeShortLabel(self._desc())
        p["longLabel"] = Helpers.makeLongLabel(self._desc())
        p["itemRgb"] = "On"
        # p["priority"] = str(self.priority)
        p["darkerLabels"] = "on"
        return p
    
    def _url(self):
        u = self.f.url
        if 'www.encodeproject.org' in u:
            if not u.endswith("?proxy=true"):
                u += "?proxy=true"
        return u
             
    def _desc(self):
        return self.exp.biosample_term_name
        if age and "unknown" != age:
            desc += [age]
        desc += [name]
        desc = " ".join(desc)
        return desc

    def lines(self):
        for k, v in self.p.iteritems():
            if v:
                yield k + " " + v + '\n'
        yield '\n'
        
class Tracks(object):
    def __init__(self, assembly):
        self.assembly = assembly
        self.tracks = []

    def addExpBestBigWig(self, exp):
        files = Helpers.bigWigFilters(self.assembly, exp.files)
        if not files:
            eprint(exp.encodeID)
            raise Exception("expected a file...")
        for f in files:
            t = BigWigTrack(self.assembly, exp, f)
            self.tracks.append(t)

    def lines(self):
        for t in self.tracks:
            for line in t.lines():
                yield line

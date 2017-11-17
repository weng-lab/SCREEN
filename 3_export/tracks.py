from __future__ import print_function

import sys
import os
from collections import OrderedDict, defaultdict

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils, eprint, AddPath, printt, printWroteNumLines

import helpers as Helpers

class BigWigTrack(object):
    def __init__(self, assembly, exp, f, parent):
        self.assembly = assembly
        self.exp = exp
        self.f = f
        self.parent = parent
        self.p = self._init()

    def _init(self):
        p = OrderedDict()
        p["track"] = Helpers.sanitize(self.f.expID + '_' + self.f.fileID)
        p["parent"] = self.parent
        p["subGroups"] = Helpers.unrollEquals(self._subgroups())
        #p["desc"] = self._desc()
        p["bigDataUrl"] = self._url()
        p["visibility"] = "dense"
        p["type"] = "bigWig"
        p["color"] = Helpers.colorize(self.exp)
        p["height"] = "maxHeightPixels 64:12:8"
        p["visibility"] = "full"
        p["shortLabel"] = Helpers.makeShortLabel(self._desc())
        p["longLabel"] = Helpers.makeLongLabel(self.exp.description)
        p["itemRgb"] = "On"
        # p["priority"] = str(self.priority)
        p["darkerLabels"] = "on"
        p["metadata"] = Helpers.unrollEquals(self._metadata())
        return p

    def _metadata(self):
        s = {}
        s["sex"] = Helpers.getOrUnknown(self.exp.donor_sex)
        s["age"] = Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        s["donor"] = self.exp.donor_id
        return s
    
    def _subgroups(self):
        s = {}
        s["sex"] = self.exp.donor_sex
        s["sex"] = Helpers.getOrUnknown(self.exp.donor_sex)
        s["age"] = 'a' + Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        return s

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
    def __init__(self, assembly, parent):
        self.assembly = assembly
        self.parent = parent
        self.tracks = []

    def addExpBestBigWig(self, exp):
        files = Helpers.bigWigFilters(self.assembly, exp.files)
        if not files:
            eprint(exp.encodeID)
            raise Exception("expected a file...")
        for f in files:
            t = BigWigTrack(self.assembly, exp, f, self.parent)
            self.tracks.append(t)

    def lines(self):
        for t in self.tracks:
            for line in t.lines():
                yield line

    def subgroups(self):
        r = defaultdict(set)
        for t in self.tracks:
            for k, v in t._subgroups().iteritems():
                r[k].add(v)
        return r

from __future__ import print_function

import sys
import os
import urllib
from collections import OrderedDict, defaultdict

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils, eprint, AddPath, printt, printWroteNumLines

import helpers as Helpers

class Parent:
    def __init__(self, parent, on):
        self.parent = parent
        self.on = on

    def param(self, active):
        if active:
            return self.parent + ' on'
        return self.parent + ' off'

class BigWigTrack(object):
    def __init__(self, assembly, exp, f, parent, active):
        self.assembly = assembly
        self.exp = exp
        self.f = f
        self.parent = parent
        self.active = active
        self.p = self._init()

    def _init(self):
        p = OrderedDict()
        p["track"] = Helpers.sanitize(self.f.expID + '_' + self.f.fileID)
        p["parent"] = self.parent.param(self.active)
        p["subGroups"] = Helpers.unrollEquals(self._subgroups())
        p["bigDataUrl"] = self._url()
        p["visibility"] = Helpers.viz("full", self.active)
        p["type"] = "bigWig"
        p["color"] = Helpers.colorize(self.exp)
        p["height"] = "maxHeightPixels 64:12:8"
        p["shortLabel"] = Helpers.makeShortLabel(self.exp.assay_term_name, self.exp.tf)
        p["longLabel"] = Helpers.makeLongLabel(self._desc())
        p["itemRgb"] = "On"
        # p["priority"] = str(self.priority)
        p["darkerLabels"] = "on"
        p["metadata"] = Helpers.unrollEquals(self._metadata())
        return p

    def _metadata(self):
        s = {}
        s["age"] = Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        s["sex"] = Helpers.getOrUnknown(self.exp.donor_sex)
        s["accession"] = self.exp.encodeID
        s["description"] = Helpers.sanitize(self._desc())
        s["donor"] = self.exp.donor_id
        return s

    def _subgroups(self):
        s = {}
        s["donor"] = Helpers.getOrUnknown(self.exp.donor_id)
        s["assay"] = Helpers.getOrUnknown(self.exp.assay_term_name)
        s["label"] = Helpers.getOrUnknown(self.exp.tf)
        s["age"] = 'a' + Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        self.presentation = {}
        self.presentation["label"] = (s["label"],
                                   Helpers.html_escape(Helpers.getOrUnknown(self.exp.tf)))
        self.presentation["assay"] = (s["assay"], s["assay"])
        self.presentation["donor"] = (s["donor"], s["donor"])
        self.presentation["age"] = (s["age"],
                                    Helpers.html_escape(Helpers.getOrUnknown(self.exp.age_display)))
        return s

    def _url(self):
        u = self.f.url
        if 'www.encodeproject.org' in u:
            if not u.endswith("?proxy=true"):
                u += "?proxy=true"
        return u

    def _desc(self):
        exp = self.exp
        desc = [self.exp.encodeID]
        if exp.biosample_summary:
            desc.append(Helpers.sanitize(exp.biosample_summary.strip()))
        elif exp.description:
            desc.append(exp.description)
        else:
            desc.append(exp.assay_term_name)
            if exp.tf:
                desc.append(exp.tf)
            age = exp.age_display
            if age and "unknown" != age:
                desc += [age]
        desc.append('(%s)' % self.f.output_type)
        return " ".join(desc)

    def lines(self, idx):
        for k, v in self.p.iteritems():
            if v:
                yield k + " " + v + '\n'
        if self.active:
            yield "priority " + str(idx) + '\n'
        yield '\n'

class BigBedTrack(object):
    def __init__(self, assembly, exp, f, parent, active):
        self.assembly = assembly
        self.exp = exp
        self.f = f
        self.parent = parent
        self.active = active
        self.p = self._init()

    def _init(self):
        p = OrderedDict()
        p["track"] = Helpers.sanitize(self.f.expID + '_' + self.f.fileID)
        p["parent"] = self.parent.param(self.active)
        p["subGroups"] = Helpers.unrollEquals(self._subgroups())
        p["bigDataUrl"] = self._url()
        p["visibility"] = Helpers.viz("pack", self.active)
        p["type"] = "bigBed"
        p["shortLabel"] = Helpers.makeShortLabel(self.exp.assay_term_name, self.exp.tf)
        p["longLabel"] = Helpers.makeLongLabel(self._desc())
        p["itemRgb"] = "On"
        p["color"] = Helpers.colorize(self.exp)
        # p["priority"] = str(self.priority)
        p["darkerLabels"] = "on"
        p["metadata"] = Helpers.unrollEquals(self._metadata())
        return p

    def _url(self):
        u = self.f.url
        if 'www.encodeproject.org' in u:
            if not u.endswith("?proxy=true"):
                u += "?proxy=true"
        return u

    def _desc(self):
        exp = self.exp
        desc = [self.exp.encodeID]
        if exp.biosample_summary:
            desc.append(Helpers.sanitize(exp.biosample_summary.strip()))
        elif exp.description:
            desc.append(exp.description)
        else:
            desc.append(exp.assay_term_name)
            if exp.tf:
                desc.append(exp.tf)
            age = exp.age_display
            if age and "unknown" != age:
                desc += [age]
        desc.append('(%s)' % self.f.output_type)
        return " ".join(desc)

    def _metadata(self):
        s = {}
        s["age"] = Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        s["sex"] = Helpers.getOrUnknown(self.exp.donor_sex)
        s["accession"] = self.exp.encodeID
        s["description"] = Helpers.sanitize(self._desc())
        s["donor"] = self.exp.donor_id
        return s

    def _subgroups(self):
        s = {}
        s["donor"] = Helpers.getOrUnknown(self.exp.donor_id)
        s["assay"] = Helpers.getOrUnknown(self.exp.assay_term_name)
        s["label"] = Helpers.getOrUnknown(self.exp.tf)
        s["age"] = 'a' + Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        self.presentation = {}
        self.presentation["label"] = (s["label"],
                                   Helpers.html_escape(Helpers.getOrUnknown(self.exp.tf)))
        self.presentation["assay"] = (s["assay"], s["assay"])
        self.presentation["donor"] = (s["donor"], s["donor"])
        self.presentation["age"] = (s["age"],
                                    Helpers.html_escape(Helpers.getOrUnknown(self.exp.age_display)))
        return s

    def lines(self, idx):
        for k, v in self.p.iteritems():
            if v:
                yield k + " " + v + '\n'
        if self.active:
            yield "priority " + str(idx) + '\n'
        yield '\n'

class CompositeExpTrack(object):
    def __init__(self, assembly, parent, exp, active):
        self.assembly = assembly
        self.parent = parent
        self.exp = exp
        self.active = active

    def _addExpBestBigWig(self, exp, active):
        files = Helpers.bigWigFilters(self.assembly, exp)
        expID = exp.encodeID

        if not files:
            eprint(expID)
            raise Exception("expected a file...")
        ret = []
        for f in files:
            t = BigWigTrack(self.assembly, exp, f, self.parent, active)
            ret.append(t)
        return ret

    def _addExpBestBed(self, exp, active):
        files = Helpers.bigBedFilters(self.assembly, exp)
        expID = exp.encodeID

        if not files:
            eprint(expID)
            #raise Exception("expected a file...", exp)
            return []
        ret = []
        for f in files:
            t = BigBedTrack(self.assembly, exp, f, self.parent, active)
            ret.append(t)
            break
        return ret

    def addExp(self):
        self.beds = self._addExpBestBed(self.exp, self.active)
        self.bigWigs = self._addExpBestBigWig(self.exp, self.active)

    def tracks(self):
        for t in self.beds:
            yield t
        for t in self.bigWigs:
            yield t

class Tracks(object):
    def __init__(self, assembly, parent, priorityStart):
        self.assembly = assembly
        self.parent = parent
        self.priorityStart = priorityStart
        self.tracks = []

    def addExp(self, exp, active):
        ct = CompositeExpTrack(self.assembly, self.parent, exp, active)
        ct.addExp()
        self.tracks.append(ct)

    def lines(self):
        tracks = self._sortedTracks()
        counter = 0
        for compositeTracks in tracks:
            for t in compositeTracks.tracks():
                counter += 1
                for line in t.lines(self.priorityStart + counter):
                    yield line

    def _sortedTracks(self):
        tracks = self.tracks

        def preferredSortOrder(exp):
            if exp.isDNaseSeq():
                return 1
            if exp.isChipSeqTF():
                if "CTCF" == exp.label:
                    return 4
            if exp.isChipSeqHistoneMark():
                if "H3K4me3" == exp.label:
                    return 2
                if "H3K27ac" == exp.label:
                    return 4
            return exp.label

        return sorted(tracks, key = lambda t: preferredSortOrder(t.exp))

    def subgroups(self):
        r = defaultdict(set)
        for tracks in self.tracks:
            for t in tracks.tracks():
                for k in Helpers.SubGroupKeys:
                    r[k].add(t.presentation[k])
        return r

from __future__ import print_function

import sys
import os
import urllib
from collections import OrderedDict, defaultdict

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from utils import Utils, eprint, AddPath, printt, printWroteNumLines

import helpers as Helpers

def outputLines(d, indentLevel, extras = {}):
    prefix = '\t' * indentLevel
    for k, v in d.iteritems():
        if v:
            yield prefix + k + " " + str(v) + '\n'
    for k, v in extras.iteritems():
        if v:
            yield prefix + k + " " + str(v) + '\n'
    yield '\n'

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
        self.view = "bigWig"
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
        p["darkerLabels"] = "on"
        p["metadata"] = Helpers.unrollEquals(self._metadata())
        p["view"] = self.view
        return p

    def _metadata(self):
        s = {}
        s["age"] = Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        s["sex"] = Helpers.getOrUnknown(self.exp.donor_sex)
        s["accession"] = self.exp.encodeID
        s["description"] = Helpers.sanitize(self._desc())
        s["donor"] = self.exp.donor_id
        s["view"] = self.view
        return s

    def _subgroups(self):
        s = {}
        s["donor"] = Helpers.getOrUnknown(self.exp.donor_id)
        s["assay"] = Helpers.getOrUnknown(self.exp.assay_term_name)
        s["label"] = Helpers.getOrUnknown(self.exp.tf)
        s["age"] = 'a' + Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        s["view"] = self.view
        self.presentation = {}
        self.presentation["label"] = (s["label"],
                                   Helpers.html_escape(Helpers.getOrUnknown(self.exp.tf)))
        self.presentation["assay"] = (s["assay"], s["assay"])
        self.presentation["donor"] = (s["donor"], s["donor"])
        self.presentation["age"] = (s["age"],
                                    Helpers.html_escape(Helpers.getOrUnknown(self.exp.age_display)))
        self.presentation["view"] = (s["view"], s["view"])
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
        extras = {}
        if self.active:
            extras["priority"] = idx
        return outputLines(self.p, 1, extras)

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
        p["parent"] = self.parent.param(self.parent.on)
        p["subGroups"] = Helpers.unrollEquals(self._subgroups())
        p["bigDataUrl"] = self._url()
        p["visibility"] = Helpers.viz("dense", self.active)
        p["type"] = "bigBed"
        p["shortLabel"] = Helpers.makeShortLabel(self.exp.assay_term_name, self.exp.tf)
        p["longLabel"] = Helpers.makeLongLabel(self._desc())
        p["itemRgb"] = "On"
        p["color"] = Helpers.colorize(self.exp)
        p["darkerLabels"] = "on"
        p["metadata"] = Helpers.unrollEquals(self._metadata())
        p["view"] = self.exp.encodeID
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
        s["view"] = self.exp.encodeID
        return s

    def _subgroups(self):
        s = {}
        s["donor"] = Helpers.getOrUnknown(self.exp.donor_id)
        s["assay"] = Helpers.getOrUnknown(self.exp.assay_term_name)
        s["label"] = Helpers.getOrUnknown(self.exp.tf)
        s["age"] = 'a' + Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        s["view"] = self.exp.encodeID
        self.presentation = {}
        self.presentation["label"] = (s["label"],
                                   Helpers.html_escape(Helpers.getOrUnknown(self.exp.tf)))
        self.presentation["assay"] = (s["assay"], s["assay"])
        self.presentation["donor"] = (s["donor"], s["donor"])
        self.presentation["age"] = (s["age"],
                                    Helpers.html_escape(Helpers.getOrUnknown(self.exp.age_display)))
        self.presentation["view"] = (s["view"], s["view"])
        return s

    def lines(self, idx):
        extras = {}
        if self.active:
            extras["priority"] = idx
        return outputLines(self.p, 2, extras)

class cRETrack(object):
    def __init__(self, assembly, exp, stateType, cREaccession, parent, active):
        self.assembly = assembly
        self.exp = exp
        self.stateType = stateType
        self.cREaccession = cREaccession
        self.parent = parent
        a = False
        if active and "5group" == stateType:
            a = True
        self.active = a
        self.p = self._init()

    def _init(self):
        p = OrderedDict()
        p["track"] = Helpers.sanitize(self.exp.encodeID + '_' + self.cREaccession)
        p["parent"] = self.parent.param(self.parent.on)
        p["subGroups"] = Helpers.unrollEquals(self._subgroups())
        p["bigDataUrl"] = self._url()
        p["visibility"] = Helpers.viz("dense", self.active)
        p["type"] = "bigBed 9"
        p["shortLabel"] = Helpers.makeShortLabel(self.exp.assay_term_name, self.exp.tf)
        p["longLabel"] = Helpers.makeLongLabel(self._desc())
        p["itemRgb"] = "On"
        p["darkerLabels"] = "on"
        p["metadata"] = Helpers.unrollEquals(self._metadata())
        p["view"] = self.exp.encodeID
        return p

    def _url(self):
        return os.path.join("https://www.encodeproject.org/files/",
                            self.cREaccession,
                            "@@download/",
                            self.cREaccession + ".bigBed?proxy=true")

    def _desc(self):
        exp = self.exp
        return self.cREaccession + " " + self.stateType + " " + exp.description

    def _metadata(self):
        s = {}
        s["age"] = Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        s["sex"] = Helpers.getOrUnknown(self.exp.donor_sex)
        s["accession"] = self.exp.encodeID
        s["description"] = Helpers.sanitize(self._desc())
        s["donor"] = self.exp.donor_id
        s["view"] = self.exp.encodeID
        return s

    def _subgroups(self):
        s = {}
        s["donor"] = Helpers.getOrUnknown(self.exp.donor_id)
        s["assay"] = Helpers.getOrUnknown(self.exp.assay_term_name)
        s["label"] = Helpers.getOrUnknown(self.exp.tf)
        s["age"] = 'a' + Helpers.sanitize(Helpers.getOrUnknown(self.exp.age_display))
        s["view"] = self.exp.encodeID
        self.presentation = {}
        self.presentation["label"] = (s["label"],
                                   Helpers.html_escape(Helpers.getOrUnknown(self.exp.tf)))
        self.presentation["assay"] = (s["assay"], s["assay"])
        self.presentation["donor"] = (s["donor"], s["donor"])
        self.presentation["age"] = (s["age"],
                                    Helpers.html_escape(Helpers.getOrUnknown(self.exp.age_display)))
        self.presentation["view"] = (s["view"], s["view"])
        return s

    def lines(self, idx):
        extras = {}
        if self.active:
            extras["priority"] = idx
        return outputLines(self.p, 2, extras)

class CompositeExpTrack(object):
    def __init__(self, assembly, parent, exp, active):
        self.assembly = assembly
        self.parent = parent
        self.exp = exp
        self.active = active
        self.bedParent = Parent(parent.parent + '_view_' + exp.encodeID, parent.on)

    def _addExpBestBigWig(self, exp, active):
        files = Helpers.bigWigFilters(self.assembly, exp)
        expID = exp.encodeID

        ret = []
        if not files:
            eprint(expID)
        else:
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
            t = BigBedTrack(self.assembly, exp, f, self.bedParent, active)
            ret.append(t)
            break # TODO allow multiple bigBeds, if needed
        return ret

    def _addcREs(self, exp, active, cREs):
        ret = []
        cREaccessions = set()
        for stateType, accession in cREs.iteritems():
            if accession not in cREaccessions:
                t = cRETrack(self.assembly, exp, stateType, accession, self.bedParent, active)
                ret.append(t)
                cREaccessions.add(accession)
        return ret

    def addExp(self, cREs):
        self.beds = self._addExpBestBed(self.exp, self.active)
        self.bigWigs = self._addExpBestBigWig(self.exp, self.active)
        self.cREs = self._addcREs(self.exp, self.active, cREs)

    def view(self):
        p = OrderedDict()
        p["track"] = self.bedParent.parent
        p["parent"] = self.parent.param(self.active)
        p["view"] = self.exp.encodeID
        p["visibility"] = "dense"
        p["type"] = "bigBed"
        return p

    def tracks(self):
        for t in self.beds + self.cREs + self.bigWigs:
            yield t

class Tracks(object):
    def __init__(self, assembly, parent, priorityStart):
        self.assembly = assembly
        self.parent = parent
        self.priorityStart = priorityStart
        self.tracks = []

    def addExp(self, exp, active, cREs):
        ct = CompositeExpTrack(self.assembly, self.parent, exp, active)
        ct.addExp(cREs)
        self.tracks.append(ct)

    def lines(self):
        tracks = self._sortedTracks()
        counter = 0
        for ct in tracks:
            for t in ct.bigWigs:
                counter += 1
                for line in t.lines(self.priorityStart + counter):
                    yield line
            if len(ct.beds + ct.cREs) > 0:
                # empty view not allowed
                for line in outputLines(ct.view(), 1):
                    yield line
                for t in ct.beds + ct.cREs:
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

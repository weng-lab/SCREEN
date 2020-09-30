#!/usr/bin/env python

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function

import sys
import os
import json
import numpy

from fc_common import FCPaths


class Statistics:

    def __init__(self, intersection_fnp):
        self.ixgenes = {}
        self.ixcres = {}
        with open(FCPaths.genetsv, "r") as f:
            i = 0
            for line in f:
                if i == 0:
                    i = 1
                    continue
                p = line.strip().split("\t")
                self.ixgenes[p[0]] = {
                    "class": p[3],
                    "cREs": [],
                    "len": 1
                }
        with open(intersection_fnp, "r") as f:
            for line in f:
                p = line.strip().split("\t")
                self.ixgenes[p[3]]["len"] = int(p[2]) - int(p[1])
                self.ixgenes[p[3]]["cREs"].append(p[8])
                if p[8] not in self.ixcres:
                    self.ixcres[p[8]] = []
                self.ixcres[p[8]].append(p[3])
            sys.stdout.flush()

    def cres_per_kb(self, f=lambda x: True):
        return {
            k: float(len(v["cREs"])) / float(v["len"]) * 1000.0
            for k, v in self.ixgenes.iteritems() if f(v)
        }

    def cres_per_kb_distr(self, hbins, f=lambda x: True):
        q = self.cres_per_kb(f)
        x = [x for _, x in q.iteritems() if x > 0.0]
        qr = [numpy.percentile(x, z) for z in range(0, 125, 25)]
        return {
            "total": len(q),
            "intersecting": len(x),
            "avg": numpy.mean(x),
            "stdev": numpy.std(x),
            "bins": list(numpy.histogram(x, hbins)[0]),
            "quartiles": {
                "values": list(qr),
                "outliers": [v for v in x if v < qr[1] - 1.5 * (qr[3] - qr[1]) or v > qr[3] + 1.5 * (qr[3] - qr[1])]
            }
        }


def _process(intersection_fnp, out_fnp):
    s = Statistics(intersection_fnp)
    hbins = numpy.arange(0, 5, 0.05)
    cpkb = [x for _, x in s.cres_per_kb(lambda x: len(x["cREs"]) > 0).iteritems()]
    j = {
        "genes": {
            "total": len(s.ixgenes),
            "intersecting": len(cpkb),
            "perKB": {
                "avg": numpy.mean(cpkb),
                "stdev": numpy.std(cpkb),
                "bins": list(numpy.histogram(cpkb, hbins)[0])
            }
        },
        "cREs": {
            "intersecting": len(s.ixcres)
        },
        "classes": {}
    }
    classes = set([x["class"] for _, x in s.ixgenes.iteritems()])
    for _class in classes:
        j["classes"][_class] = s.cres_per_kb_distr(hbins, lambda x: x["class"] == _class)
    j["classes"]["non-coding"] = s.cres_per_kb_distr(hbins, lambda x: "lncRNA" in x["class"])
    j["classes"]["coding"] = s.cres_per_kb_distr(hbins, lambda x: "coding" in x["class"] or "pseudogene" in x["class"])

    with open(out_fnp, "wb") as o:
        o.write(json.dumps(j) + "\n")


def main():
    _process(FCPaths.intersected, FCPaths.global_statistics)
    _process(FCPaths.twokb_intersected, FCPaths.twokb_statistics)
    return 0


if __name__ == "__main__":
    sys.exit(main())

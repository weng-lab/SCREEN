#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip

from coord import Coord
from pg_common import PGcommon
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom


class PGdeWrapper:
    def __init__(self, pg):
        self.assemblies = ["mm10"]  # Config.assemblies
        self.pgs = {a: PGde(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]


class PGde(object):
    def __init__(self, pw, assembly):
        self.pw = pw
        self.assembly = assembly

    def nearbyDEs(self, coord, halfWindow, ct1, ct2, pval):
        c = coord.expanded(halfWindow)
        ctTableName = self.assembly + "_de_cts"

        rows = self.pw.fetchall("nearbyDEs", """
        SELECT id, deCtName FROM {tn}
        """.format(tn=ctTableName))
        ctsToId = {r[1]: r[0] for r in rows}

        ct1id = ctsToId[ct1]
        ct2id = ctsToId[ct2]

        q = """
        SELECT start, stop, log2FoldChange, ensembl
        from {deTn} as de
        inner join {giTn} as gi
        on de.ensembl = gi.ensemblid
        where gi.chrom = %(chrom)s
        AND de.padj <= %(pval)s
        AND int4range(gi.start, gi.stop) && int4range(%(start)s, %(stop)s)
        and de.leftCtId = %(leftCtId)s and de.rightCtId = %(rightCtId)s
        """.format(deTn=self.assembly + "_de",
                   giTn=self.assembly + "_gene_info")
        des = self.pw.fetchall("nearbyDEs", q,
                               {"chrom": c.chrom, "start": c.start,
                                "stop": c.end, "pval": pval,
                                "leftCtId": ct2id, "rightCtId": ct1id})

        if not des:
            fdes = self.pw.fetchall("nearbyDEs", q,
                                    {"chrom": c.chrom, "start": c.start,
                                     "stop": c.end, "pval": pval,
                                     "leftCtId": ct1id, "rightCtId": ct2id})
            des = []
            for d in fdes:
                d = list(d)
                d[2] = -1.0 * d[2]
                des.append(d)
        return des

    def ctToId(self):
        rows = self.pw.fetchall("nearbyDEs", """
        SELECT id, deCtName FROM {tn}
        """.format(tn=self.ctTableName))
        ctsToId = {r[1]: r[0] for r in rows}
        return ctsToId

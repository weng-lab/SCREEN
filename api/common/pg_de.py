#!/usr/bin/env python3

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

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor


class PGdeWrapper:
    def __init__(self, pg):
        self.assemblies = ["mm10"]  # Config.assemblies
        self.pgs = {a: PGde(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]


class PGde(object):
    def __init__(self, pg, assembly):
        self.pg = pg
        self.assembly = assembly

    def nearbyDEs(self, coord, halfWindow, ct1, ct2, pval):
        c = coord.expanded(halfWindow)

        with getcursor(self.pg.DBCONN, "nearbyDEs") as curs:
            ctTableName = self.assembly + "_de_cts"

            curs.execute("""
            SELECT id, deCtName FROM {tn}
            """.format(tn=ctTableName))
            ctsToId = {r[1]: r[0] for r in curs.fetchall()}

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
            curs.execute(q, {"chrom": c.chrom, "start": c.start,
                             "stop": c.end, "pval": pval,
                             "leftCtId": ct2id, "rightCtId": ct1id})
            des = curs.fetchall()

            if not des:
                curs.execute(q, {"chrom": c.chrom, "start": c.start,
                                 "stop": c.end, "pval": pval,
                                 "leftCtId": ct1id, "rightCtId": ct2id})
                fdes = curs.fetchall()
                des = []
                for d in fdes:
                    d = list(d)
                    d[2] = -1.0 * d[2]
                    des.append(d)
        return des

    def ctToId(self):
        with getcursor(self.pg.DBCONN, "nearbyDEs") as curs:
            curs.execute("""
        SELECT id, deCtName FROM {tn}
    """.format(tn=self.ctTableName))
        ctsToId = {r[1]: r[0] for r in self.curs.fetchall()}
        return ctsToId

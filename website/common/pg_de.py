#!/usr/bin/env python

import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip

from coord import Coord
from pg_common import PGcommon

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor

class PGdeWrapper:
    def __init__(self, pg):
        self.pgs = {
            "hg19" : PGde(pg, "hg19"),
            "mm10" : PGde(pg, "mm10")}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

class PGde:
    def __init__(self, pg, assembly):
        self.pg = pg
        self.assembly = assembly

    def nearbyDEs(self, coord, halfWindow, ct1, ct2, pval):
        c = coord.expanded(halfWindow)
        with getcursor(self.pg.DBCONN, "nearbyDEs") as curs:
            q = """
            SELECT start, stop, log2FoldChange, leftName, rightName, ensembl
            from {deTn} as de
            inner join {giTn} as gi
            on de.ensembl = gi.ensemblid
            where gi.chrom = %(chrom)s
            AND de.padj <= %(pval)s
            AND int4range(gi.start, gi.stop) && int4range(%(start)s, %(stop)s)
            and de.leftname = %(leftName)s and de.rightname = %(rightName)s
""".format(deTn = self.assembly + "_de",
           giTn = self.assembly + "_gene_info")
            curs.execute(q, { "chrom" : c.chrom, "start" : c.start,
                              "stop" : c.end, "pval" : pval,
                              "leftName" : ct1, "rightName" : ct2})
            des = curs.fetchall()
        #print("des", len(des), " ".join(q.split('\n')), c, ct1, ct2)
        return des


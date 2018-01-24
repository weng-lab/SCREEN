#!/usr/bin/env python2

from __future__ import print_function

import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip
import psycopg2.extras

from coord import Coord
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import checkAssembly

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor


class PGsearchWrapper:
    def __init__(self, pg):
        self.assemblies = Config.assemblies
        self.pgs = {a: PGsearch(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]


class PGsearch(object):
    def __init__(self, pg, assembly):
        self.pg = pg
        checkAssembly(assembly)
        self.assembly = assembly


    def crePos(self, accession):
        with getcursor(self.pg.DBCONN, "cre_pos") as curs:
            curs.execute("""
SELECT chrom, start, stop
FROM {tn}
WHERE accession = %s
""".format(tn=self.assembly + "_cre_all"), (accession, ))
            r = curs.fetchone()
        if not r:
            print("ERROR: missing", accession)
            return None
        return Coord(r[0], r[1], r[2])

    def creRanks(self, accession, chrom):
        cols = """dnase_zscores
        ctcf_zscores
        enhancer_zscores
        h3k27ac_zscores
        h3k4me3_zscores
        insulator_zscores
        promoter_zscores""".split('\n')
        cols = [c.strip() for c in cols]
        r = self._getColsForAccession(accession, chrom, cols)
        cols = [c.split('_')[0] for c in cols]
        return dict(zip(cols, r))

    def creMostsimilar(self, acc, assay, threshold=20000):
        if self.assembly == "hg19":
            return []

        def whereclause(r):
            _assay = assay
            if assay != "dnase":
                _assay = assay.replace("_dnase", "") + "_only"

            return " or ".join(["%s_rank[%d] < %d" % (_assay, i + 1, threshold)
                                for i in xrange(len(r)) if r[i] < threshold])

        with getcursor(self.pg.DBCONN, "cre$CRE::mostsimilar") as curs:
            curs.execute("""
SELECT {assay}_rank
FROM {assembly}_cre_all
WHERE accession = %s
""".format(assay=assay,
                assembly=self.assembly), acc)
            r = curs.fetchone()
            if not r:
                if 0:
                    print("cre$CRE::mostsimilar WARNING: no results for accession",
                          acc, " -- returning empty set")
                return []
            whereclause = whereclause(r[0])
            if len(whereclause.split(" or ")) > 200:
                if 0:
                    print("cre$CRE::mostsimilar", "NOTICE:", acc,
                          "is active in too many cell types",
                          len(whereclause.split(" or ")),
                          "returning empty set")
                return []

            if not whereclause:
                if 0:
                    print("cre$CRE::mostsimilar NOTICE:", acc,
                          "not active in any cell types; returning empty set")
                return []

            curs.execute("""
SELECT accession,
intarraysimilarity(%(r)s, {assay}_rank, {threshold}) AS similarity,
chrom, start, stop
FROM {assembly}_cre_all
WHERE {whereclause}
ORDER BY similarity DESC LIMIT 10
""".format(assay=assay, assembly=self.assembly,
                threshold=threshold, whereclause=whereclause), {"r": r})
            rr = curs.fetchall()
        return [{"accession": r[0], "chrom": r[2], "start": r[3], "end": r[4]}
                for r in rr]


    def nearbyCREs(self, coord, halfWindow, cols, isProximalOrDistal):
        c = coord.expanded(halfWindow)
        tableName = self.assembly + "_cre_all"
        q = """
SELECT {cols} FROM {tn}
WHERE chrom = %s
AND int4range(start, stop) && int4range(%s, %s)
""".format(cols=','.join(cols), tn=tableName)

        if isProximalOrDistal is not None:
            q += """
AND isProximal is {isProx}
""".format(isProx=str(isProximalOrDistal))

        with getcursor(self.pg.DBCONN, "nearbyCREs") as curs:
            curs.execute(q, (c.chrom, c.start, c.end))
            return curs.fetchall()

    def rankMethodToCellTypes(self):
        with getcursor(self.pg.DBCONN, "pg$getRanIdxToCellType") as curs:
            curs.execute("""
SELECT idx, celltype, rankmethod
FROM {assembly}_rankcelltypeindexex
""".format(assembly=self.assembly))
            _map = {}
            for r in curs.fetchall():
                _map[r[2]] = [(r[0], r[1])] if r[2] not in _map else _map[r[2]] + [(r[0], r[1])]
        ret = {}
        for k, v in _map.iteritems():
            ret[k] = [x[1] for x in sorted(v, lambda a, b: a[0] - b[0])]
            #print(k, ret[k])
        # print(ret.keys())
        # ['Enhancer', 'H3K4me3', 'H3K27ac', 'Promoter', 'DNase', 'Insulator', 'CTCF']
        return ret

    def _getColsForAccession(self, accession, chrom, cols):
        tableName = self.assembly + "_cre_all"
        with getcursor(self.pg.DBCONN, "_getColsForAccession") as curs:
            curs.execute("""
SELECT {cols}
FROM {tn}
WHERE accession = %s
""".format(cols=','.join(cols), tn=tableName), (accession,))
            return curs.fetchone()

    def allDatasets(self):
        # TODO: fixme!!
        dects = """
C57BL/6_embryonic_facial_prominence_embryo_11.5_days
C57BL/6_embryonic_facial_prominence_embryo_12.5_days
C57BL/6_embryonic_facial_prominence_embryo_13.5_days
C57BL/6_embryonic_facial_prominence_embryo_14.5_days
C57BL/6_embryonic_facial_prominence_embryo_15.5_days
C57BL/6_forebrain_embryo_11.5_days
C57BL/6_forebrain_embryo_12.5_days
C57BL/6_forebrain_embryo_13.5_days
C57BL/6_forebrain_embryo_14.5_days
C57BL/6_forebrain_embryo_15.5_days
C57BL/6_forebrain_embryo_16.5_days
C57BL/6_forebrain_postnatal_0_days
C57BL/6_heart_embryo_11.5_days
C57BL/6_heart_embryo_12.5_days
C57BL/6_heart_embryo_13.5_days
C57BL/6_heart_embryo_14.5_days
C57BL/6_heart_embryo_15.5_days
C57BL/6_heart_embryo_16.5_days
C57BL/6_heart_postnatal_0_days
C57BL/6_hindbrain_embryo_11.5_days
C57BL/6_hindbrain_embryo_12.5_days
C57BL/6_hindbrain_embryo_13.5_days
C57BL/6_hindbrain_embryo_14.5_days
C57BL/6_hindbrain_embryo_15.5_days
C57BL/6_hindbrain_embryo_16.5_days
C57BL/6_hindbrain_postnatal_0_days
C57BL/6_intestine_embryo_14.5_days
C57BL/6_intestine_embryo_15.5_days
C57BL/6_intestine_embryo_16.5_days
C57BL/6_intestine_postnatal_0_days
C57BL/6_kidney_embryo_14.5_days
C57BL/6_kidney_embryo_15.5_days
C57BL/6_kidney_embryo_16.5_days
C57BL/6_kidney_postnatal_0_days
C57BL/6_limb_embryo_11.5_days
C57BL/6_limb_embryo_12.5_days
C57BL/6_limb_embryo_13.5_days
C57BL/6_limb_embryo_14.5_days
C57BL/6_limb_embryo_15.5_days
C57BL/6_liver_embryo_11.5_days
C57BL/6_liver_embryo_12.5_days
C57BL/6_liver_embryo_13.5_days
C57BL/6_liver_embryo_14.5_days
C57BL/6_liver_embryo_15.5_days
C57BL/6_liver_embryo_16.5_days
C57BL/6_liver_postnatal_0_days
C57BL/6_lung_embryo_14.5_days
C57BL/6_lung_embryo_15.5_days
C57BL/6_lung_embryo_16.5_days
C57BL/6_lung_postnatal_0_days
C57BL/6_midbrain_embryo_11.5_days
C57BL/6_midbrain_embryo_12.5_days
C57BL/6_midbrain_embryo_13.5_days
C57BL/6_midbrain_embryo_14.5_days
C57BL/6_midbrain_embryo_15.5_days
C57BL/6_midbrain_embryo_16.5_days
C57BL/6_midbrain_postnatal_0_days
C57BL/6_neural_tube_embryo_11.5_days
C57BL/6_neural_tube_embryo_12.5_days
C57BL/6_neural_tube_embryo_13.5_days
C57BL/6_neural_tube_embryo_14.5_days
C57BL/6_neural_tube_embryo_15.5_days
C57BL/6_stomach_embryo_14.5_days
C57BL/6_stomach_embryo_15.5_days
C57BL/6_stomach_embryo_16.5_days
C57BL/6_stomach_postnatal_0_days""".split('\n')
        dects = set(dects)

        def makeDataset(r):
            return {"assay": r[0],
                    "expID": r[1],
                    "fileID": r[2],
                    "tissue": r[3],
                    "biosample_summary": r[4],
                    "biosample_type": r[5],
                    "cellTypeName": r[6],
                    "cellTypeDesc": r[7],
                    "name": r[7],
                    "value": r[6],  # for datatables
                    "isde": r[6] in dects,
                    "synonyms": r[8]
                    }

        tableName = self.assembly + "_datasets"
        cols = ["assay", "expID", "fileID", "tissue",
                "biosample_summary", "biosample_type", "cellTypeName",
                "cellTypeDesc", "synonyms"]
        with getcursor(self.pg.DBCONN, "datasets") as curs:
            curs.execute("""
SELECT {cols} FROM {tn}
""".format(tn=tableName, cols=','.join(cols)))
            return [makeDataset(r) for r in curs.fetchall()]

    def loadMoreTracks(self):
        tableName = self.assembly + "_more_tracks"
        with getcursor(self.pg.DBCONN, "pg$loadMoretracks") as curs:
            curs.execute("""
SELECT cellTypeName, tracks
FROM {tn}
""".format(tn=tableName))
            rows = curs.fetchall()
        ret = {}
        for r in rows:
            ret[r[0]] = r[1]
        return ret

    def datasets(self, assay):
        return self.pgc.datasets(assay)



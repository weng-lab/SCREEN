#!/usr/bin/env python

from __future__ import print_function

import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip
import psycopg2.extras

from coord import Coord
from pg_common import PGcommon
from config import Config
from pg_cre_table import PGcreTable
from get_set_mc import GetOrSetMemCache

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor, timedQuery
from utils import eprint

class PGsearchWrapper:
    def __init__(self, pg):
        self.assemblies = Config.assemblies
        self.pgs = {a : PGsearch(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

class PGsearch(GetOrSetMemCache):
    def __init__(self, pg, assembly):
        GetOrSetMemCache.__init__(self, assembly, "PGsearch")
        self.pg = pg
        self.assembly = assembly

        self.pgc = PGcommon(self.pg, self.assembly)
        self.ctmap = self.pgc.makeCtMap()
        self.ctsTable = self.pgc.makeCTStable()
        
    def allCREs(self):
        tableName = self.assembly + "_cre_all"
        q = """
SELECT accession, chrom, start, stop
FROM {tn}
""".format(
            tn = tableName)
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q)
            r = curs.fetchall()
        return [{"accession" : e[0],
                 "chrom" : e[1],
                 "start" : e[2],
                 "end" : e[3]} for e in r]

    def chromCounts(self):
        tableName = self.assembly + "_cre_all_nums"
        q = """SELECT chrom, count from {tn}""".format(
            tn = tableName)
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q)
            r = curs.fetchall()
        arr = [(e[0], e[1]) for e in r]
        return natsorted(arr, key=lambda y: y[0])

    def creHist(self):
        tableName = self.assembly + "_cre_bins"
        q = """SELECT chrom, buckets, numBins, binMax from {tn}""".format(
            tn = tableName)
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q)
            r = curs.fetchall()
        return {e[0] : {"bins" : e[1],
                        "numBins" : e[2],
                        "binMax" : e[3]} for e in r}

    def rfacets_active(self, j):
        present = []
        ct = j.get("cellType", None)
        if ct:
            for assay in ["dnase", "promoter", "enhancer", "ctcf"]:
                if ct in self.ctmap[assay]:
                    present.append(assay)
        return present

    def haveSCT(self, j):
        ct = j.get("cellType", None)
        ret = []
        if ct:
            if ct in self.ctsTable:
                ret = ["sctv"]
        return ret

    def creTable(self, j, chrom, start, stop):
        pct = PGcreTable(self.pg, self.assembly, self.ctmap, self.ctsTable)
        return pct.creTable(j, chrom, start, stop)

    def creTableDownloadBed(self, j, fnp):
        pct = PGcreTable(self.pg, self.assembly, self.ctmap, self.ctsTable)
        return pct.creTableDownloadBed(j, fnp)

    def creTableDownloadJson(self, j, fnp):
        pct = PGcreTable(self.pg, self.assembly, self.ctmap, self.ctsTable)
        return pct.creTableDownloadJson(j, fnp)

    def crePos(self, accession):
        with getcursor(self.pg.DBCONN, "cre_pos") as curs:
            curs.execute("""
SELECT chrom, start, stop
FROM {tn}
WHERE accession = %s
""".format(tn = self.assembly + "_cre_all"), (accession, ))
            r = curs.fetchone()
        if not r:
            print("ERROR: missing", accession)
            return None
        return Coord(r[0], r[1], r[2])

    def _getGenes(self, accession, chrom, curs, allOrPc):
        curs.execute("""
SELECT gi.approved_symbol, g.distance, gi.ensemblid_ver
FROM
(SELECT UNNEST(gene_{allOrPc}_id) geneid,
UNNEST(gene_{allOrPc}_distance) distance
FROM {tn} WHERE accession = %s) AS g
INNER JOIN {gtn} AS gi
ON g.geneid = gi.geneid
""".format(tn = self.assembly + "_cre_all",
           gtn = self.assembly + "_gene_info",
           allOrPc = allOrPc), (accession, ))
        return curs.fetchall()

    def creGenes(self, accession, chrom):
        with getcursor(self.pg.DBCONN, "cre_genes") as curs:
            return (self._getGenes(accession, chrom, curs, "all"),
                    self._getGenes(accession, chrom, curs, "pc"))

    def intersectingSnps(self, accession, coord, halfWindow):
        c = coord.expanded(halfWindow)
        tableName = self.assembly + "_snps"
        with getcursor(self.pg.DBCONN, "intersectingSnps") as curs:
            curs.execute("""
SELECT start, stop, snp
FROM {tn}
WHERE chrom = %s
AND int4range(start, stop) && int4range(%s, %s)
""".format(tn = tableName), (c.chrom, c.start, c.end))
            snps = curs.fetchall()
        ret = []
        for snp in snps:
            start = snp[0]
            end = snp[1]
            ret.append({"chrom" : c.chrom,
                        "cre_start" : coord.start,
                        "cre_end" : coord.end,
                        "accession" : accession,
                        "snp_start" : start,
                        "snp_end" : end,
                        "name" : snp[2],
                        "distance" : min(abs(coord.end - end),
                                         abs(coord.start - start))})
        return ret

    def nearbyCREs(self, coord, halfWindow, cols, isProximalOrDistal):
        c = coord.expanded(halfWindow)
        tableName = self.assembly + "_cre_all"
        q = """
SELECT {cols} FROM {tn}
WHERE chrom = %s
AND int4range(start, stop) && int4range(%s, %s)
""".format(cols = ','.join(cols), tn = tableName)

        if isProximalOrDistal is not None:
            q += """
AND isProximal is {isProx}
""".format(isProx = str(isProximalOrDistal))

        with getcursor(self.pg.DBCONN, "nearbyCREs") as curs:
            curs.execute(q, (c.chrom, c.start, c.end))
            return curs.fetchall()

    def distToNearbyCREs(self, accession, coord, halfWindow):
        cols = ["start", "stop", "accession"]
        cres = self.nearbyCREs(coord, halfWindow, cols, None)
        ret = []
        for c in cres:
            acc = c[2]
            if acc == accession:
                continue
            start = c[0]
            end = c[1]
            ret.append({"name" : acc,
                        "distance" : min(abs(coord.end - end),
                                         abs(coord.start - start))})
        return ret

    def cresInTad(self, accession, chrom, start):
        with getcursor(self.pg.DBCONN, "cresInTad") as curs:
            q = """
SELECT accession, abs(%s - start) AS distance
FROM {cre}
WHERE chrom = %s
AND int4range(start, stop) && int4range(
(SELECT int4range(min(start), max(stop))
FROM {ti} ti
inner join {tads} tads
on ti.tadname = tads.tadname
WHERE accession = %s))
AND abs(%s - start) < 100000
ORDER BY 2
""".format(cre = self.assembly + "_cre_all",
           ti = self.assembly + "_tads_info",
           tads = self.assembly + "_tads")
            curs.execute(q, (start, chrom, accession, start))
            rows = curs.fetchall()
        frows = filter(lambda x: x[0] != accession, rows)
        return [{"accession" : r[0], "distance" : r[1]} for r in frows]

    def genesInTad(self, accession, chrom):
        with getcursor(self.pg.DBCONN, "genesInTad") as curs:
            curs.execute("""
SELECT geneIDs
FROM {tn}
WHERE accession = %s
""".format(tn = self.assembly + "_tads"), (accession, ))
            rows = curs.fetchall()
        return rows

    def rankMethodToIDxToCellType(self):
        pg = PGcommon(self.pg, self.assembly)
        return pg.rankMethodToIDxToCellType()

    def rankMethodToCellTypes(self):
        with getcursor(self.pg.DBCONN, "pg$getRanIdxToCellType") as curs:
            curs.execute("""
SELECT idx, celltype, rankmethod
FROM {assembly}_rankcelltypeindexex
""".format(assembly = self.assembly))
            _map = {}
            for r in curs.fetchall():
                _map[r[2]] = [(r[0], r[1])] if r[2] not in _map else _map[r[2]] + [(r[0], r[1])]
        ret = {}
        for k, v in _map.iteritems():
            ret[k] = [x[1] for x in sorted(v, lambda a, b: a[0] - b[0])]
            #print(k, ret[k])
        #print(ret.keys())
        # ['Enhancer', 'H3K4me3', 'H3K27ac', 'Promoter', 'DNase', 'Insulator', 'CTCF']
        return ret

    def _getColsForAccession(self, accession, chrom, cols):
        tableName = self.assembly + "_cre_all"
        with getcursor(self.pg.DBCONN, "_getColsForAccession") as curs:
            curs.execute("""
SELECT {cols}
FROM {tn}
WHERE accession = %s
""".format(cols = ','.join(cols), tn = tableName), (accession,))
            return curs.fetchone()

    def creRanksPromoter(self, accession, chrom):
        cols = ["promoter_zscores"]
        r = self._getColsForAccession(accession, chrom, cols)
        return {"zscores" : { "Promoter" : r[0]} }

    def creRanksEnhancer(self, accession, chrom):
        cols = ["enhancer_zscores"]
        r = self._getColsForAccession(accession, chrom, cols)
        return {"zscores" : { "Enhancer" : r[0]} }

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
                          acc," -- returning empty set")
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

    def peakIntersectCount(self, accession, chrom, totals):
        tableName = self.assembly + "_" + "peakIntersections"
        with getcursor(self.pg.DBCONN, "peakIntersectCount") as curs:
            curs.execute("""
SELECT tf, histone
FROM {tn}
WHERE accession = %s
""".format(tn = tableName), (accession,))
            r = curs.fetchone()
        tfs = [{"name" : k, "n" : len(set(v)), "total" : totals[k]}
               for k,v in r[0].iteritems()]
        histones = [{"name" : k, "n" : len(set(v)), "total" : totals[k]}
                    for k,v in r[1].iteritems()]
        return {"tf" : tfs, "histone" : histones}

    def tfHistoneDnaseList(self):
        tableName = self.assembly + "_peakIntersectionsMetadata"
        with getcursor(self.pg.DBCONN, "peakIntersectCount") as curs:
            curs.execute("""
SELECT distinct label
FROM {tn}
""".format(tn = tableName))
            return sorted([r[0] for r in curs.fetchall()])

    def genePos(self, gene):
        ensemblid = gene
        if gene.startswith("ENS") and '.' in gene:
            ensemblid = gene.split('.')[0]
        tableName = self.assembly + "_gene_info"
        with getcursor(self.pg.DBCONN, "cre_pos") as curs:
            q = """
SELECT chrom, start, stop, approved_symbol, ensemblid_ver FROM {tn}
WHERE chrom != ''
AND (approved_symbol = %s
OR ensemblid = %s
OR ensemblid_ver = %s)
""".format(tn = tableName)
            curs.execute(q, (gene, ensemblid, gene))
            r = curs.fetchone()
        if not r:
            print("ERROR: missing", gene)
            return None, None
        return Coord(r[0], r[1], r[2]), (r[3], r[4])

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
            return {"assay" : r[0],
                    "expID" : r[1],
                    "fileID" : r[2],
                    "tissue" : r[3],
                    "biosample_summary" : r[4],
                    "biosample_type" : r[5],
                    "cellTypeName" : r[6],
                    "cellTypeDesc" : r[7],
                    "name" : r[7],
                    "value" : r[6], # for datatables
                    "isde" : r[6] in dects
            }

        tableName = self.assembly + "_datasets"
        cols = ["assay", "expID", "fileID", "tissue",
                "biosample_summary", "biosample_type", "cellTypeName",
                "cellTypeDesc"]
        with getcursor(self.pg.DBCONN, "datasets") as curs:
            curs.execute("""
SELECT {cols} FROM {tn}
""".format(tn = tableName, cols = ','.join(cols)))
            return [makeDataset(r) for r in curs.fetchall()]

    def datasets(self, assay):
        return self.pgc.datasets(assay)

    def genemap(self):
        with getcursor(self.pg.DBCONN, "pg::genemap") as curs:
            curs.execute("""
SELECT ensemblid, approved_symbol, strand
FROM {tn}
WHERE strand != ''
""".format(tn = self.assembly + "_gene_info"))
            rows = curs.fetchall()
            toSymbol = {r[0]: r[1] for r in rows}
            toStrand = {r[0]: r[2] for r in rows}
            curs.execute("""
SELECT ensemblid_ver, approved_symbol, strand
FROM {tn}
WHERE strand != ''
""".format(tn = self.assembly + "_gene_info"))
            rows = curs.fetchall()
            toSymbol.update({r[0]: r[1] for r in rows})
            toStrand.update({r[0]: r[2] for r in rows})
        return toSymbol, toStrand

    def genesInRegion(self, chrom, start, stop):
        tableName = self.assembly + "_gene_info"
        fields = ["approved_symbol", "start", "stop", "strand"]
        q = """
SELECT {fields}
FROM {tn}
WHERE chrom = %s
AND int4range(start, stop) && int4range(%s, %s)
ORDER BY start
""".format(fields = ','.join(fields), tn = tableName)

        with getcursor(self.pg.DBCONN, "pg::genesInRegion") as curs:
            curs.execute(q, (chrom, start, stop))
            rows = curs.fetchall()
        fields = ["gene", "start", "stop", "strand"]
        return [dict(zip(fields, r)) for r in rows]

    def histoneTargetExps(self, accession, target):
        peakTn = self.assembly + "_peakIntersections"
        peakMetadataTn = self.assembly + "_peakIntersectionsMetadata"

        q = """
SELECT expID, fileID, biosample_term_name
FROM {peakMetadataTn}
WHERE fileID IN (
SELECT distinct(jsonb_array_elements_text(histone->%s))
FROM {peakTn}
WHERE accession = %s
)
ORDER BY biosample_term_name
""".format(peakTn = peakTn, peakMetadataTn = peakMetadataTn)

        with getcursor(self.pg.DBCONN, "pg::genesInRegion") as curs:
            curs.execute(q, (target, accession))
            rows = curs.fetchall()
        return [{"expID" : r[0] + ' / ' + r[1],
                 "biosample_term_name" : r[2] } for r in rows]

    def tfTargetExps(self, accession, target):
        peakTn = self.assembly + "_peakIntersections"
        peakMetadataTn = self.assembly + "_peakIntersectionsMetadata"

        q = """
SELECT expID, fileID, biosample_term_name
FROM {peakMetadataTn}
WHERE fileID IN (
SELECT distinct(jsonb_array_elements_text(tf->%s))
FROM {peakTn}
WHERE accession = %s
)
ORDER BY biosample_term_name
""".format(peakTn = peakTn, peakMetadataTn = peakMetadataTn)

        with getcursor(self.pg.DBCONN, "pg::genesInRegion") as curs:
            curs.execute(q, (target, accession))
            rows = curs.fetchall()
        return [{"expID" : r[0] + ' / ' + r[1],
                 "biosample_term_name" : r[2] } for r in rows]

    def rampageByGene(self, ensemblid_ver):
        q = """
SELECT *
FROM {tn}
WHERE ensemblid_ver = %s
""".format(tn = self.assembly + "_rampage")

        with getcursor(self.pg.DBCONN, "pg::genesInRegion",
                       cursor_factory = psycopg2.extras.NamedTupleCursor) as curs:
            curs.execute(q, (ensemblid_ver, ))
            rows = curs.fetchall()
        ret = []
        for r in rows:
            dr = r._asdict()
            nr = {"data" : {}}
            for k, v in dr.iteritems():
                if k.startswith("encff"):
                    nr["data"][k] = v
                    continue
                nr[k] = v
            if not nr["data"]:
                continue
            ret.append(nr)
        return ret

    def rampage_info(self):
        q = """
SELECT *
FROM {tn}
""".format(tn = self.assembly + "_rampage_info")

        with getcursor(self.pg.DBCONN, "pg::genesInRegion",
                       cursor_factory = psycopg2.extras.NamedTupleCursor) as curs:
            curs.execute(q)
            rows = curs.fetchall()
        ret = {}
        for r in rows:
            d = r._asdict()
            ret[d["fileid"]] = d
        return ret

    def geBiosampleTypes(self):
        q = """
SELECT DISTINCT(biosample_type)
FROM {tn}
ORDER BY 1
""".format(tn = "r_rnas_" + self.assembly)
        with getcursor(self.pg.DBCONN, "pg::geBiosampleTypes") as curs:
            curs.execute(q)
            rows = curs.fetchall()
        return [r[0] for r in rows]

    def geneIDsToApprovedSymbol(self):
        q = """
SELECT geneid, approved_symbol
FROM {gtn}
ORDER BY 1
""".format(gtn = self.assembly + "_gene_info")
        with getcursor(self.pg.DBCONN, "pg::geneIDsToApprovedSymbol") as curs:
            curs.execute(q)
            rows = curs.fetchall()
        return {r[0] : r[1] for r in rows}

    def getHelpKeys(self):
        with getcursor(self.pg.DBCONN, "getHelpKeys") as curs:
            curs.execute("""
            SELECT key, title, summary
            FROM helpkeys
            """)
            rows = curs.fetchall()
        return {r[0] : {"title": r[1],
                        "summary": r[2]}
                for r in rows}

    def tfHistCounts(self):
        with getcursor(self.pg.DBCONN, "tfHistCounts") as curs:
            curs.execute("""
SELECT COUNT(label), label
FROM {assembly}_peakintersectionsmetadata
GROUP BY label
            """.format(assembly = self.assembly))
            rows = curs.fetchall()
        return {r[1] : r[0] for r in rows}

    def geneExpressionTissues(self):
        with getcursor(self.pg.DBCONN, "geneExpressionTissues") as curs:
            curs.execute("""
SELECT DISTINCT(organ)
FROM r_rnas_{assembly}
""".format(assembly = self.assembly))
            return [r[0] for r in curs.fetchall()]

    def loadNineStateGenomeBrowser(self):
        tableName = self.assembly + "_nine_state"
        with getcursor(self.pg.DBCONN, "pg$loadNineStateGenomeBrowser",
        cursor_factory = psycopg2.extras.NamedTupleCursor) as curs:
            curs.execute("""
SELECT cellTypeName, cellTypeDesc, dnase, h3k4me3, h3k27ac, ctct
FROM {tn}
""".format(tn = tableName))
            rows = curs.fetchall()
        ret = {}
        for r in rows:
            r = r._asdict()
            ret[r["celltypename"]] = r
        return ret


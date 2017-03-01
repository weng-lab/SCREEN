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

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor
from utils import eprint

class PGsearchWrapper:
    def __init__(self, pg):
        self.pgs = {
            "hg19" : PGsearch(pg, "hg19"),
            "mm10" : PGsearch(pg, "mm10")}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

class PGsearch:
    def __init__(self, pg, assembly):
        self.pg = pg
        self.assembly = assembly

        pg = PGcommon(self.pg, self.assembly)
        self.ctmap = pg.makeCtMap()

    def allCREs(self):
        tableName = self.assembly + "_cre_all"
        q = """SELECT accession, chrom, start, stop from {tn}""".format(
            tn = tableName)
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q)
            r = curs.fetchall()
        return [{"accession" : e[0],
                 "chrom" : e[1],
                 "start" : e[2],
                 "end" : e[3]} for e in r]

    def chromCounts(self):
        tableName = self.assembly + "_cre_nums"
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

    def _type_clauses(self, ct, assayterm):
        if not assayterm:
            return []
        assaymap = {"chromatin-accessible": [("dnase", "dnase")],
                    "promoter-like": [("promoter", "h3k4me3_only"), ("dnase", "dnase")],
                    "enhancer-like": [("enhancer", "h3k27ac_only"), ("dnase", "dnase")],
                    "insulator-like": [("ctcf", "ctcf_only")] }
        allmap = {"chromatin-accessible": "dnase_zscore_max",
                  "promoter-like": "promoterMaxz",
                  "enhancer-like": "enhancerMaxz",
                  "insulator-like": "ctcf_only_zscore_max" }
        ret = []
        if ct:
            if assayterm not in assaymap:
                print("WARNING: invalid element type %s; ignoring" % assayterm)
                return ret
            for assay in assaymap[assayterm]:
                if ct not in self.ctmap[assay[0]]:
                    continue
                cti = self.ctmap[assay[0]][ct]
                ret.append("cre.%s_zscore[%d] >= 1.64" % (assay[1], cti))
            return ret
        if assayterm not in allmap:
            print("WARNING: invalid element type %s; ignoring" % assayterm)
            return ret
        return ["cre.%s >= 1.64" % allmap[assayterm]]

    def _creTableWhereClause(self, j, chrom, start, stop):
        whereclauses = []

        if 0:
            print(j, """TODO need more variables here:
        gene_all_start, gene_all_end,
        gene_pc_start, gene_pc_end""")

        """
        tfclause = "peakintersections.accession = cre.accession"
        if "tfs" in j:
            tfclause += " and peakintersections.tf ?| array(" + ",".join(["'%s'" % tf for tf in j["tfs"]]) + ")"
        """

        ct = j.get("cellType", None)
        fields = []
        whereclauses = [] # self._type_clauses(ct, j["element_type"])

        if chrom and start and stop:
            whereclauses += ["cre.chrom = '%s'" % chrom,
                             "int4range(cre.start, cre.stop) && int4range(%s, %s)" % (int(start), int(stop))]

        if ct:
            for assay in [("dnase", "dnase"),
                          ("promoter", "h3k4me3_only"),
                          ("enhancer", "h3k27ac_only"),
                          ("ctcf", "ctcf_only")]:
                if ct not in self.ctmap[assay[0]]:
                    fields.append("'' AS %s_zscore" % (assay[0]))
                    continue
                cti = self.ctmap[assay[0]][ct]
                fields.append("cre.%s_zscore[%d] AS %s_zscore" % (assay[1], cti, assay[0]))

                if "rank_%s_start" % assay[0] in j and "rank_%s_end" % assay[0] in j:
                    _range = [j["rank_%s_start" % assay[0]] / 100.0,
                              j["rank_%s_end" % assay[0]] / 100.0]
                    minDefault = -10.0  # must match slider default
                    maxDefault = 10.0   # must match slider default
                    if isclose(_range[0], minDefault) and isclose(_range[1], maxDefault):
                        continue # not actually filtering on zscore, yet...
                    if not isclose(_range[0], minDefault):
                        whereclauses.append("(%s)" %
                                            "cre.%s_zscore[%d] >= %f" % (assay[1], cti, _range[0]))
                    elif not isclose(_range[1], maxDefault):
                        whereclauses.append("(%s)" %
                                            "cre.%s_zscore[%d] <= %f" % (assay[1], cti, _range[1]))
                    else:
                        whereclauses.append("(%s)" % " and ".join(
                                ["cre.%s_zscore[%d] >= %f" % (assay[1], cti, _range[0]),
                                 "cre.%s_zscore[%d] <= %f" % (assay[1], cti, _range[1])] ))
        else:
            allmap = {"dnase": "dnase_zscore_max",
                      "promoter": "promoterMaxz",
                      "enhancer": "enhancerMaxz",
                      "ctcf": "ctcf_only_zscore_max" }
            for x in ["dnase", "promoter", "enhancer", "ctcf"]:
                if "rank_%s_start" % x in j and "rank_%s_end" in j:
                    _range = [j["rank_%s_start" % x] / 100.0,
                              j["rank_%s_end" % x] / 100.0]
                    whereclauses.append("(%s)" % " and ".join(
                        ["cre.%s >= %f" % (allmap[x], _range[0]),
                         "cre.%s <= %f" % (allmap[x], _range[1]) ] ))
                fields.append("cre.%s AS %s_zscore" % (allmap[x], x))

        accs = j.get("accessions", [])
        if accs and len(accs) > 0:
            if type(accs[0]) is dict:
                accs = [x["value"] for x in accs if x["checked"]]
            accs = filter(lambda x: isaccession(x), accs)
            if accs:
                accs = ["'%s'" % x.upper() for x in accs]
                accsQuery = "accession IN (%s)" % ','.join(accs)
                whereclauses.append("(%s)" % accsQuery)

        whereclause = ""
        if len(whereclauses) > 0:
            whereclause = "WHERE " + " and ".join(whereclauses)
        #print(whereclause)
        return (fields, whereclause)

    def _rfacets_active(self, j):
        present = []
        ct = j.get("cellType", None)
        if ct:
            for assay in ["dnase", "promoter", "enhancer", "ctcf"]:
                if ct in self.ctmap[assay]:
                    present.append(assay)
        return present

    def creTable(self, j, chrom, start, stop):
        tableName = self.assembly + "_cre_all"

        fields, whereclause = self._creTableWhereClause(j, chrom, start, stop)
        fields = ', '.join(fields + [
            "accession", "maxZ",
            "cre.chrom", "cre.start",
            "cre.stop - cre.start AS len",
            "ARRAY[ARRAY[infoAll1.approved_symbol, infoAll2.approved_symbol, infoAll3.approved_symbol], ARRAY[infoPc1.approved_symbol, infoPc2.approved_symbol, infoPc3.approved_symbol] ] AS genesAllPc",
            "0::int as in_cart",
            "cre.cre_group"])

        with getcursor(self.pg.DBCONN, "_cre_table") as curs:
            q = """
SELECT JSON_AGG(r) from(
SELECT {fields}
FROM {tn} AS cre
inner join {gtn} AS infoAll1
	on cre.gene_all_id[1] = infoAll1.geneid
inner join {gtn} AS infoAll2
        on cre.gene_all_id[2] = infoAll2.geneid
inner join {gtn} AS infoAll3
        on cre.gene_all_id[3] = infoAll3.geneid
inner join {gtn} AS infoPc1
        on cre.gene_pc_id[1] = infoPc1.geneid
inner join {gtn} AS infoPc2
        on cre.gene_pc_id[2] = infoPc2.geneid
inner join {gtn} AS infoPc3
        on cre.gene_pc_id[3] = infoPc3.geneid
{whereclause}
ORDER BY maxz DESC
LIMIT 1000) r
""".format(fields = fields, tn = tableName,
           gtn = self.assembly + "_gene_info",
           whereclause = whereclause)

            #eprint(q)
            curs.execute(q)
            rows = curs.fetchall()[0][0]
            if not rows:
                rows = []
            #print(rows[0] if len(rows) > 0 else "")

            # TODO: could be slow......
            if 0:
                curs.execute("""
                SELECT count(0)
                FROM {tn} AS cre
                {whereclause}
                """.format(tn = tableName, whereclause = whereclause))
                total = curs.fetchone()[0]
        return {"cres": rows}

    def creTableDownloadBed(self, j, fnp):
        chrom = checkChrom(self.assembly, j)
        start = j.get("coord_start", 0)
        stop = j.get("coord_end", 0)

        tableName = self.assembly + "_cre_all"

        fields, whereclause = self._creTableWhereClause(j, chrom, start, stop)
        fields = ', '.join(["cre.chrom", "cre.start",
                            "cre.stop",
                            "accession", "maxZ"])

        q = """
COPY (
SELECT {fields}
FROM {tn} AS cre
{whereclause}
) to STDOUT
with DELIMITER E'\t'
""".format(fields = fields, tn = tableName,
           whereclause = whereclause)

        with getcursor(self.pg.DBCONN, "_cre_table_bed") as curs:
            with gzip.open(fnp, 'w') as f:
                curs.copy_expert(q, f)

    def creTableDownloadJson(self, j, fnp):
        chrom = checkChrom(self.assembly, j)
        start = j.get("coord_start", None)
        stop = j.get("coord_end", None)

        tableName = self.assembly + "_cre_all"

        fields, whereclause = self._creTableWhereClause(j, chrom, start, stop)

        q = """
copy (
SELECT JSON_AGG(r) from (
SELECT *
FROM {tn} AS cre
{whereclause}
) r
) to STDOUT
with DELIMITER E'\t'
""".format(tn = tableName,
           whereclause = whereclause)

        with getcursor(self.pg.DBCONN, "_cre_table_json") as curs:
            with gzip.open(fnp, 'w') as f:
                curs.copy_expert(q, f)

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

    def _getGenes(self, accession, chrom, curs, group):
        curs.execute("""
SELECT gi.approved_symbol, g.distance
FROM
(SELECT UNNEST(gene_{group}_id) geneid,
UNNEST(gene_{group}_distance) distance
FROM {tn} WHERE accession = %s) AS g
INNER JOIN {gtn} AS gi
ON g.geneid = gi.geneid
""".format(tn = self.assembly + "_cre_all",
           gtn = self.assembly + "_gene_info",
           group = group), (accession, ))
        return curs.fetchall()

    def creGenes(self, accession, chrom):
        with getcursor(self.pg.DBCONN, "cre_genes") as curs:
            return (self._getGenes(accession, chrom, curs, "all"),
                    self._getGenes(accession, chrom, curs, "pc"))

    def intersectingSnps(self, accession, coord, halfWindow):
        c = coord.expanded(halfWindow)
        tableName = self.assembly + "_snps_" + c.chrom
        with getcursor(self.pg.DBCONN, "intersectingSnps") as curs:
            curs.execute("""
SELECT start, stop, name
FROM {tn}
WHERE int4range(start, stop) && int4range(%s, %s)
""".format(tn = tableName), (c.start, c.end))
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
            curs.execute(q, (chrom, start, accession, start))
            rows = curs.fetchall()
        return [{"accession" : r[0], "distance" : r[1]} for r in rows]

    def genesInTad(self, accession, chrom):
        with getcursor(self.pg.DBCONN, "creTad") as curs:
            curs.execute("""
SELECT gi.approved_symbol AS name
FROM
(SELECT UNNEST(tads) geneid
FROM {tn} WHERE accession = %s) AS g
INNER JOIN {gtn} AS gi
ON g.geneid = gi.geneid
""".format(tn = self.assembly + "_cre_all",
           gtn = self.assembly + "_gene_info"), (accession, ))
            rows = curs.fetchall()
        return [{"name" : r[0]} for r in rows]

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
        cols = ["h3k4me3_dnase_zscore"]
        r = self._getColsForAccession(accession, chrom, cols)
        return {"zscores" : { "Promoter" : r[0]} }

    def creRanksEnhancer(self, accession, chrom):
        cols = ["h3k27ac_dnase_zscore"]
        r = self._getColsForAccession(accession, chrom, cols)
        return {"zscores" : { "Enhancer" : r[0]} }

    def creRanks(self, accession, chrom):
        cols = """dnase_zscore
        ctcf_only_zscore
        ctcf_dnase_zscore
        h3k27ac_only_zscore
        h3k27ac_dnase_zscore
        h3k4me3_only_zscore
        h3k4me3_dnase_zscore""".split('\n')
        r = self._getColsForAccession(accession, chrom, cols)
        return {"zscores" : { "dnase" : r[0],
                              "ctcf-only" : r[1],
                              "dnase+ctcf" : r[2],
                              "h3k27ac-only" : r[3],
                              "dnase+h3k27ac" : r[4],
                              "h3k4me3-only" : r[5],
                              "dnase+h3k4me3": r[6] }}

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

    def peakIntersectCount(self, accession, chrom):
        tableName = self.assembly + "_" + "peakIntersections"
        with getcursor(self.pg.DBCONN, "peakIntersectCount") as curs:
            curs.execute("""
SELECT tf, histone, dnase
FROM {tn}
WHERE accession = %s
""".format(tn = tableName), (accession,))
            r = curs.fetchone()
        tfs = [{"name" : k, "n" : len(set(v))} for k,v in r[0].iteritems()]
        histones = [{"name" : k, "n" : len(set(v))} for k,v in r[1].iteritems()]
        dnases = [{"name" : k, "n" : len(set(v))} for k,v in r[2].iteritems()]
        return {"tf" : tfs, "histone" : histones, "dnase" : dnases}

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
C57BL-6_embryonic_facial_prominence_embryo_11.5_days
C57BL-6_embryonic_facial_prominence_embryo_12.5_days
C57BL-6_embryonic_facial_prominence_embryo_13.5_days
C57BL-6_embryonic_facial_prominence_embryo_14.5_days
C57BL-6_embryonic_facial_prominence_embryo_15.5_days
C57BL-6_forebrain_embryo_11.5_days
C57BL-6_forebrain_embryo_12.5_days
C57BL-6_forebrain_embryo_13.5_days
C57BL-6_forebrain_embryo_14.5_days
C57BL-6_forebrain_embryo_15.5_days
C57BL-6_forebrain_embryo_16.5_days
C57BL-6_forebrain_postnatal_0_days
C57BL-6_heart_embryo_11.5_days
C57BL-6_heart_embryo_12.5_days
C57BL-6_heart_embryo_13.5_days
C57BL-6_heart_embryo_14.5_days
C57BL-6_heart_embryo_15.5_days
C57BL-6_heart_embryo_16.5_days
C57BL-6_heart_postnatal_0_days
C57BL-6_hindbrain_embryo_11.5_days
C57BL-6_hindbrain_embryo_12.5_days
C57BL-6_hindbrain_embryo_13.5_days
C57BL-6_hindbrain_embryo_14.5_days
C57BL-6_hindbrain_embryo_15.5_days
C57BL-6_hindbrain_embryo_16.5_days
C57BL-6_hindbrain_postnatal_0_days
C57BL-6_intestine_embryo_14.5_days
C57BL-6_intestine_embryo_15.5_days
C57BL-6_intestine_embryo_16.5_days
C57BL-6_intestine_postnatal_0_days
C57BL-6_kidney_embryo_14.5_days
C57BL-6_kidney_embryo_15.5_days
C57BL-6_kidney_embryo_16.5_days
C57BL-6_kidney_postnatal_0_days
C57BL-6_limb_embryo_11.5_days
C57BL-6_limb_embryo_12.5_days
C57BL-6_limb_embryo_13.5_days
C57BL-6_limb_embryo_14.5_days
C57BL-6_limb_embryo_15.5_days
C57BL-6_liver_embryo_11.5_days
C57BL-6_liver_embryo_12.5_days
C57BL-6_liver_embryo_13.5_days
C57BL-6_liver_embryo_14.5_days
C57BL-6_liver_embryo_15.5_days
C57BL-6_liver_embryo_16.5_days
C57BL-6_liver_postnatal_0_days
C57BL-6_lung_embryo_14.5_days
C57BL-6_lung_embryo_15.5_days
C57BL-6_lung_embryo_16.5_days
C57BL-6_lung_postnatal_0_days
C57BL-6_midbrain_embryo_11.5_days
C57BL-6_midbrain_embryo_12.5_days
C57BL-6_midbrain_embryo_13.5_days
C57BL-6_midbrain_embryo_14.5_days
C57BL-6_midbrain_embryo_15.5_days
C57BL-6_midbrain_embryo_16.5_days
C57BL-6_midbrain_postnatal_0_days
C57BL-6_neural_tube_embryo_11.5_days
C57BL-6_neural_tube_embryo_12.5_days
C57BL-6_neural_tube_embryo_13.5_days
C57BL-6_neural_tube_embryo_14.5_days
C57BL-6_neural_tube_embryo_15.5_days
C57BL-6_stomach_embryo_14.5_days
C57BL-6_stomach_embryo_15.5_days
C57BL-6_stomach_embryo_16.5_days
C57BL-6_stomach_postnatal_0_days""".split('\n')
        dects = set(dects)

        def makeDataset(r):
            return {"assay" : r[0],
                    "expID" : r[1],
                    "fileID" : r[2],
                    "tissue" : r[3],
                    "biosample_summary" : r[4],
                    "biosample_type" : r[5],
                    "cellTypeName" : r[6],
                    "name" : r[4],
                    "value" : r[6], # for datatables
                    "isde" : r[6] in dects
            }

        tableName = self.assembly + "_datasets"
        cols = ["assay", "expID", "fileID", "tissue",
                "biosample_summary", "biosample_type", "cellTypeName"]
        with getcursor(self.pg.DBCONN, "datasets") as curs:
            curs.execute("""
SELECT {cols} FROM {tn}
""".format(tn = tableName, cols = ','.join(cols)))
            return [makeDataset(r) for r in curs.fetchall()]

    def datasets(self, assay):
        with getcursor(self.pg.DBCONN, "datasets") as curs:
            q = """
SELECT cellTypeName, expID, fileID
FROM {tn}
where assay = %s
""".format(tn = self.assembly + "_datasets")
            curs.execute(q, (assay, ))
            rows = curs.fetchall()
            if 0 == curs.rowcount:
                raise Exception("no rows found--bad assay? " + assay)
        return {r[0] : (r[1], r[2]) for r in rows}

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

    def rampage(self, coord):
        q = """
select * from {tn}
WHERE chrom = %s
AND int4range(start, stop) && int4range(%s, %s)
ORDER BY tss
""".format(tn = self.assembly + "_rampage")

        with getcursor(self.pg.DBCONN, "pg::genesInRegion",
                       cursor_factory = psycopg2.extras.NamedTupleCursor) as curs:
            curs.execute(q, (coord.chrom, coord.start, coord.end))
            rows = curs.fetchall()
        ret = []
        for r in rows:
            dr = r._asdict()
            nr = {"data" : {}}
            for k, v in dr.iteritems():
                if k.startswith("encs"):
                    if 0 != v:
                        nr["data"][k] = v
                    continue
                nr[k] = v
            if not nr["data"]:
                continue
            ret.append(nr)
        return ret

    def rampage_info(self):
        q = """
SELECT expid, biosample_summary, biosample_term_name
FROM {tn}
""".format(tn = self.assembly + "_rampage_info")

        with getcursor(self.pg.DBCONN, "rampge_info") as curs:
            curs.execute(q)
            rows = curs.fetchall()
        ret = {}
        for r in rows:
            ret[r[0]] = {"bs" : r[1],
                         "btn" : r[2]}
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

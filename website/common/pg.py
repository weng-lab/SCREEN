#!/usr/bin/env python

import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip

from coord import Coord

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor

GwasEnrichmentRow = namedtuple('GwasEnrichmentRow', "biosample_term_name fdr cellTypeName".split(' '))
GwasRow = namedtuple('GwasRow',  "chrom start stop snp taggedSNP r2 ldblock authorPubmedTrait".split(' '))

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
        amap = {"DNase": "dnase", "H3K4me3": "promoter", "H3K27ac": "enhancer", "CTCF": "ctcf"}
        self.ctmap = {amap[k]: v for k, v in self.rankMethodToIDxToCellType().iteritems() if k in amap}

    def allCREs(self):
        tableName = self.assembly + "_cre"
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
        tableName = self.assembly + "_cre" + "_nums"
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

        if start and stop:
            whereclauses += ["int4range(cre.start, cre.stop) && int4range(%s, %s)" % (int(start), int(stop))]
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
        print(whereclause)
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
        if chrom:
            tableName = '_'.join([self.assembly, "cre", chrom])
        else:
            tableName = '_'.join([self.assembly, "cre"])

        fields, whereclause = self._creTableWhereClause(j, chrom, start, stop)
        fields = ', '.join(fields + ["accession", "maxZ",
                            "cre.chrom", "cre.start",
                            "cre.stop - cre.start AS len",
                            "CONCAT(infoAll.approved_symbol, ', ', infoAll2.approved_symbol, ', ', infoAll3.approved_symbol) AS gene_all",
                            "CONCAT(infoPc.approved_symbol, ', ', infoPc2.approved_symbol, ', ', infoPc3.approved_symbol) AS gene_pc",
                            "infoAll2.approved_symbol AS gene_all",
                            "0::int as in_cart"])

        with getcursor(self.pg.DBCONN, "_cre_table") as curs:
            curs.execute("""
SELECT JSON_AGG(r) from(
SELECT {fields}
FROM {tn} as cre
inner join {gtn} as infoAll
on cre.gene_all_id[1] = infoAll.geneid
inner join {gtn} as infoAll2
            on cre.gene_all_id[2] = infoAll2.geneid
inner join {gtn} as infoAll3
            on cre.gene_all_id[3] = infoAll3.geneid
inner join {gtn} as infoPc
on cre.gene_pc_id[1] = infoPc.geneid
inner join {gtn} as infoPc2
            on cre.gene_pc_id[2] = infoPc2.geneid
inner join {gtn} as infoPc3
            on cre.gene_pc_id[3] = infoPc3.geneid
{whereclause}
ORDER BY maxz desc limit 1000) r
""".format(fields = fields, tn = tableName,
           gtn = self.assembly + "_gene_info",
           whereclause = whereclause))

            rows = curs.fetchall()[0][0]
            if not rows:
                rows = []
            print(rows[0] if len(rows) > 0 else "")

            # TODO: could be slow......
            curs.execute("""
SELECT count(0) FROM {tn} as cre
{whereclause}""".format(tn = tableName, whereclause = whereclause))
            total = curs.fetchone()[0]
        return {"cres": rows, "total" : total}

    def creTableDownloadBed(self, j, fnp):
        chrom = checkChrom(self.assembly, j)
        start = j.get("coord_start", 0)
        stop = j.get("coord_end", 0)

        if chrom:
            tableName = '_'.join([self.assembly, "cre", chrom])
        else:
            tableName = '_'.join([self.assembly, "cre"])

        fields = ', '.join(["cre.chrom", "cre.start",
                            "cre.stop",
                            "accession", "maxZ"])

        fields, whereclause = self._creTableWhereClause(j, chrom, start, stop)

        q = """
COPY (
SELECT {fields}
FROM {tn} as cre
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

        if chrom:
            tableName = '_'.join([self.assembly, "cre", chrom])
        else:
            tableName = '_'.join([self.assembly, "cre"])

        fields, whereclause = self._creTableWhereClause(j, chrom, start, stop)

        q = """
copy (
SELECT JSON_AGG(r) from (
SELECT *
FROM {tn} as cre
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
SELECT chrom, start, stop FROM {tn} WHERE accession = %s
""".format(tn = self.assembly + "_cre"), (accession, ))
            r = curs.fetchone()
        if not r:
            print("ERROR: missing", accession)
            return None
        return Coord(r[0], r[1], r[2])

    def _getGenes(self, accession, chrom, curs, group):
        curs.execute("""
SELECT gi.approved_symbol, g.distance
FROM
(SELECT UNNEST(gene_{group}_id) geneid, UNNEST(gene_{group}_distance) distance
FROM {tn} WHERE accession = %s) AS g
INNER JOIN {gtn} AS gi
ON g.geneid = gi.geneid
""".format(tn = self.assembly + "_cre_" + chrom,
           gtn = self.assembly + "_gene_info",
           group = group), (accession, ))
        return curs.fetchall()

    def creGenes(self, accession, chrom):
        with getcursor(self.pg.DBCONN, "cre_genes") as curs:
            return (self._getGenes(accession, chrom, curs, "all"),
                    self._getGenes(accession, chrom, curs, "pc"))

    def intersectingSnps(self, coord, halfWindow):
        c = coord.expanded(halfWindow)
        tableName = self.assembly + "_snps_" + c.chrom
        with getcursor(self.pg.DBCONN, "intersectingSnps") as curs:
            curs.execute("""
SELECT start, stop, name FROM {tn} WHERE int4range(start, stop) &&
int4range(%s, %s)
""".format(tn = tableName), (c.start, c.end))
            snps = curs.fetchall()
        ret = []
        for snp in snps:
            start = snp[0]
            end = snp[1]
            ret.append({"name" : snp[2],
                        "distance" : min(abs(coord.end - end),
                                         abs(coord.start - start))})
        return ret

    def nearbyCREs(self, coord, halfWindow, cols, isProximalOrDistal):
        c = coord.expanded(halfWindow)
        tableName = self.assembly + "_cre_" + c.chrom
        q = """
SELECT {cols} FROM {tn}
WHERE int4range(start, stop) && int4range(%s, %s)
""".format(cols = ','.join(cols), tn = tableName)

        if isProximalOrDistal is not None:
            q += """
AND isProximal is {isProx}
""".format(isProx = str(isProximalOrDistal))

        print("nearbyCREs query:", q)

        with getcursor(self.pg.DBCONN, "nearbyCREs") as curs:
            curs.execute(q, (c.start, c.end))
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

    def creTad(self, accession, chrom):
        with getcursor(self.pg.DBCONN, "creTad") as curs:
            curs.execute("""
SELECT gi.approved_symbol AS name
FROM
(SELECT UNNEST(tads) geneid
FROM {tn} WHERE accession = %s) AS g
INNER JOIN {gtn} AS gi
ON g.geneid = gi.geneid
""".format(tn = self.assembly + "_cre_" + chrom,
           gtn = self.assembly + "_gene_info"), (accession, ))
            rows = curs.fetchall()
        return [{"name" : r[0]} for r in rows]

    def rankMethodToIDxToCellType(self):
        with getcursor(self.pg.DBCONN, "pg$getRanIdxToCellType") as curs:
            curs.execute("""
SELECT idx, celltype, rankmethod FROM {tn}
""".format(tn = self.assembly + "_rankcelltypeindexex"))
            ret = {}
            for r in curs.fetchall():
                rank_method = r[2]
                if rank_method not in ret:
                    ret[rank_method] = {}
                ret[rank_method][r[0]] = r[1]
                ret[rank_method][r[1]] = r[0]
        return ret

    def rankMethodToCellTypes(self):
        with getcursor(self.pg.DBCONN, "pg$getRanIdxToCellType") as curs:
            curs.execute("""
SELECT idx, celltype, rankmethod FROM {assembly}_rankcelltypeindexex
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
        tableName = self.assembly + "_cre_" + chrom
        with getcursor(self.pg.DBCONN, "_getColsForAccession") as curs:
            curs.execute("""
SELECT {cols}
FROM {tn}
WHERE accession = %s
""".format(cols = ','.join(cols), tn = tableName), (accession,))
            return curs.fetchone()

    def creRanksPromoter(self, accession, chrom):
        cols = ["h3k4me3_dnase_rank", "h3k4me3_dnase_zscore"]
        r = self._getColsForAccession(accession, chrom, cols)
        return {"ranks" : { "Promoter" : r[0] },
                "zscores" : { "Promoter" : r[1]}}

    def creRanksEnhancer(self, accession, chrom):
        cols = ["h3k27ac_dnase_rank", "h3k27ac_dnase_zscore"]
        r = self._getColsForAccession(accession, chrom, cols)
        return {"ranks" : { "Enhancer" : r[0] },
                "zscores" : { "Enhancer" : r[1]}}

    def creRanks(self, accession, chrom):
        cols = """dnase_rank
        ctcf_only_rank
        ctcf_dnase_rank
        h3k27ac_only_rank
        h3k27ac_dnase_rank
        h3k4me3_only_rank
        h3k4me3_dnase_rank
        dnase_zscore
        ctcf_only_zscore
        ctcf_dnase_zscore
        h3k27ac_only_zscore
        h3k27ac_dnase_zscore
        h3k4me3_only_zscore
        h3k4me3_dnase_zscore""".split('\n')
        r = self._getColsForAccession(accession, chrom, cols)
        return {"ranks" : { "dnase" : r[0],
                            "ctcf-only" : r[1],
                            "dnase+ctcf" : r[2],
                            "h3k27ac-only" : r[3],
                            "dnase+h3k27ac" : r[4],
                            "h3k4me3-only" : r[5],
                            "dnase+h3k4me3": r[6] },
                "zscores" : { "dnase" : r[7],
                              "ctcf-only" : r[8],
                              "dnase+ctcf" : r[9],
                              "h3k27ac-only" : r[10],
                              "dnase+h3k27ac" : r[11],
                              "h3k4me3-only" : r[12],
                              "dnase+h3k4me3": r[13] }}

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
FROM {assembly}_cre
WHERE accession = '{accession}'""".format(assay=assay,
                                          assembly=self.assembly,
                                          accession=acc))
            r = curs.fetchone()
            if not r:
                print("cre$CRE::mostsimilar WARNING: no results for accession",
                      acc," -- returning empty set")
                return []
            whereclause = whereclause(r[0])
            if len(whereclause.split(" or ")) > 200:
                print("cre$CRE::mostsimilar", "NOTICE:", acc,
                      "is active in too many cell types",
                      len(whereclause.split(" or ")),
                      "returning empty set")
                return []

            if not whereclause:
                print("cre$CRE::mostsimilar NOTICE:", acc,
                      "not active in any cell types; returning empty set")
                return []

            curs.execute("""
SELECT accession,
intarraysimilarity(%(r)s, {assay}_rank, {threshold}) AS similarity,
chrom, start, stop
FROM {assembly}_cre
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
        tfs = [{"name" : k, "n" : len(v)} for k,v in r[0].iteritems()]
        histones = [{"name" : k, "n" : len(v)} for k,v in r[1].iteritems()]
        dnases = [{"name" : k, "n" : len(v)} for k,v in r[2].iteritems()]
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
        tableName = self.assembly + "_gene_info"
        with getcursor(self.pg.DBCONN, "cre_pos") as curs:
            curs.execute("""
SELECT chrom, start, stop FROM {tn}
WHERE approved_symbol = %s
OR ensemblid = %s
OR ensemblid_ver = %s
""".format(tn = tableName), (gene, gene, gene))
            r = curs.fetchone()
        if not r:
            print("ERROR: missing", gene)
            return None
        return Coord(r[0], r[1], r[2])

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
        print("des", len(des), " ".join(q.split('\n')), c, ct1, ct2)
        return des

    def gwasEnrichment(self, gwas_study):
        with getcursor(self.pg.DBCONN, "gwasEnrichment") as curs:
            q = """
SELECT biosample_term_name, fdr, cellTypeName
FROM hg19_gwas_enrichment
WHERE authorPubmedTrait = %s
"""
            curs.execute(q, (gwas_study, ))
            rows = curs.fetchall()
        return [GwasEnrichmentRow(*r) for r in rows]

    def gwas(self):
        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
            SELECT chrom, start, stop, snp, taggedSNP, r2, ldblock, authorPubmedTrait
            FROM {tn}
""".format(tn = "hg19_gwas")
            curs.execute(q)
            rows = curs.fetchall()
        return [GwasRow(*r) for r in rows]

    def gwasOverlapWithCresPerc(self, gwas_study):
        print(gwas_study)
        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
SELECT COUNT(DISTINCT(ldblock))
FROM hg19_gwas as gwas, hg19_cre as cre, hg19_gwas_overlap as over
WHERE gwas.authorPubmedTrait = over.authorPubmedTrait
AND cre.accession = over.accession
AND int4range(gwas.start, gwas.stop) && int4range(cre.start, cre.stop)
AND gwas.authorPubmedTrait = %s
"""
            curs.execute(q, (gwas_study, ))
            overlapCount = curs.fetchone()[0]
            print("overlapCount", overlapCount)

            q = """
select count(distinct(ldblock))
FROM hg19_gwas as gwas
WHERE gwas.authorPubmedTrait = %s
""".format(tn = "hg19_gwas")
            curs.execute(q, (gwas_study, ))
            total = curs.fetchone()[0]
            print("total", total, gwas_study)
        return float(overlapCount) / total

    def gwasOverlapWithCres(self, gwas_study):
        print(gwas_study)
        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
SELECT cre.accession
FROM hg19_gwas as gwas, hg19_cre as cre
WHERE gwas.chrom = cre.chrom
AND int4range(gwas.start, gwas.stop) && int4range(cre.start, cre.stop)
AND gwas.authorPubmedTrait = %s
""".format(tn = "hg19_gwas")
            curs.execute(q, (gwas_study, ))
            return [r[0] for r in curs.fetchall()]

    def gwasAccessions(self, gwas_study):
        print(gwas_study)
        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
SELECT accession
FROM hg19_gwas_overlap
where authorPubmedTrait = %s
""".format(tn = "hg19_gwas")
            curs.execute(q, (gwas_study, ))
            return [r[0] for r in curs.fetchall()]

    def datasets(self, assay):
        with getcursor(self.pg.DBCONN, "gwas") as curs:
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
SELECT ensemblid, approved_symbol
FROM {tn}
""".format(tn = self.assembly + "_gene_info"))
            rows = curs.fetchall()
        return {r[0]: r[1] for r in rows}

    def gwasPercentActive(self, gwas_study, ct):
        fields = ["cre.accession", "snp",
                  "infoAll.approved_symbol AS geneid"]

        for assay in [("dnase", "dnase"),
                      ("promoter", "h3k4me3_only"),
                      ("enhancer", "h3k27ac_only"),
                      ("ctcf", "ctcf_only")]:
            if ct not in self.ctmap[assay[0]]:
                fields.append("'' AS %s_zscore" % (assay[0]))
                continue
            cti = self.ctmap[assay[0]][ct]
            fields.append("cre.%s_zscore[%d] AS %s_zscore" %
                          (assay[1], cti, assay[0]))

        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
SELECT {fields}
FROM hg19_cre as cre, hg19_gwas_overlap as over, hg19_gene_info as infoAll
WHERE cre.gene_all_id[1] = infoAll.geneid
AND cre.accession = over.accession
AND over.authorPubmedTrait = %s
""".format(fields = ', '.join(fields))
            #print(q)
            curs.execute(q, (gwas_study, ))
            accs = curs.fetchall()

        # accession, snp, geneid, dnaseZscore, promoterZscore,
        # enhancerZscore, ctcfZscore
        totalActive = 0
        total = len(accs)
        for a in accs:
            if a[3] > 1.64 or a[4] > 1.64 or a[5] > 1.64:
                totalActive += 1

        percActive = 0
        if total > 0:
            percActive = round(float(totalActive) / total * 100, 2)

        def form(v):
            return [["%s%% CREs active" % v, v, 0],
                    ["", 100 - v, v]]

        return {"accessions" : accs,
                "percActive" : percActive,
                "bar" : form(percActive),
                "header" : ["accession", "snp", "geneid",
                            "dnaseZscore", "promoterZscore",
                            "enhancerZscore", "ctcfZscore"]}

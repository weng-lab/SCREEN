#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng




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
from pg_gwas import PGgwas

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom, checkAssembly

sys.path.append(os.path.join(os.path.dirname(__file__), "../../utils"))
from utils import eprint


class PGsearchWrapper:
    def __init__(self, pw):
        self.assemblies = Config.assemblies
        self.pgs = {a: PGsearch(pw, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]


class PGsearch(object):
    def __init__(self, pw, assembly):
        self.pw = pw
        checkAssembly(assembly)
        self.assembly = assembly

        self.pgc = PGcommon(self.pw, self.assembly)
        self.pgg = PGgwas(self.pw, self.assembly)
        self.ctmap = self.pgc.makeCtMap()
        self.ctsTable = self.pgc.makeCTStable()

    def vista(self, accession):
        rows = self.pw.fetchall("vista", """
        SELECT * from {vtn} 
        WHERE accession = %(acc)s""".format(vtn = self.assembly + "_vista"),
                                {"acc": accession})
        return [{ "vid": x[2] } for x in rows]

    def versions(self):
        rows = self.pw.fetchall("versions", """
        SELECT accession, biosample, assay, version 
        FROM {tn}""".format(tn = self.assembly + "_ground_level_versions"))
        return rows
    
    def gwasJson(self, j, json):
        self.pgg.gwasPercentActive(j["gwas_study"], j["cellType"], json)
        
    def allCREs(self):
        rows = self.pw.fetchall("allCREs", """
        SELECT {tn}.accession AS accession, chrom, start, stop
        FROM {tn} 
        INNER JOIN {ttn} ON {ttn}.accession = {tn}.accession
        """.format(tn = self.assembly + "_cre_all",
                   ttn = self.assembly + "_ccres_toptier"))
        return [{"accession": e[0],
                 "chrom": e[1],
                 "start": e[2],
                 "end": e[3]} for e in rows]
    
    def chromCounts(self):
        rows = self.pw.fetchall("chromCounts", """
        SELECT chrom, count from {tn}
        """.format(tn=self.assembly + "_cre_all_nums"))
        arr = [(e[0], e[1]) for e in rows]
        return natsorted(arr, key=lambda y: y[0])

    def creHist(self):
        rows = self.pw.fetchall("creHist", """
        SELECT chrom, buckets, numBins, binMax from {tn}
        """.format(tn = self.assembly + "_cre_bins"))
        return {e[0]: {"bins": e[1],
                       "numBins": e[2],
                       "binMax": e[3]} for e in rows}

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
        pct = PGcreTable(self.pw, self.assembly, self.ctmap, self.ctsTable)
        return pct.creTable(j, chrom, start, stop)

    def geneTable(self, j, chrom, start, stop):
        pct = PGcreTable(self.pw, self.assembly, self.ctmap, self.ctsTable)
        return pct.geneTable(j, chrom, start, stop)

    def creTableDownloadBed(self, j, fnp):
        pct = PGcreTable(self.pw, self.assembly, self.ctmap, self.ctsTable)
        return pct.creTableDownloadBed(j, fnp)

    def creTableDownloadJson(self, j, fnp, cache):
        pct = PGcreTable(self.pw, self.assembly, self.ctmap, self.ctsTable)
        return pct.creTableDownloadJson(j, fnp, cache)

    def crePos(self, accession):
        r = self.pw.fetchone("cre_pos", """
        SELECT chrom, start, stop
        FROM {tn}
        WHERE accession = %s
        """.format(tn=self.assembly + "_cre_all"), (accession, ))
        if not r:
            print("ERROR: missing", accession)
            return None
        return Coord(r[0], r[1], r[2])

    def _getGenes(self, accession, chrom, allOrPc):
        rows = self.pw.fetchall("_getGenes", """
        SELECT gi.info->>'symbol' AS approved_symbol, g.distance, gi.ensemblid_ver, 
        gi.chrom, gi.start, gi.stop
        FROM
        (SELECT UNNEST(gene_{allOrPc}_id) geneid,
        UNNEST(gene_{allOrPc}_distance) distance
        FROM {tn} WHERE accession = %s) AS g
        INNER JOIN {gtn} AS gi
        ON g.geneid = gi.geneid
        """.format(tn=self.assembly + "_cre_all",
                   gtn=self.assembly + "_gene_info",
                   allOrPc=allOrPc), (accession, ))
        return rows

    def creGenes(self, accession, chrom):
        return (self._getGenes(accession, chrom, "all"),
                self._getGenes(accession, chrom, "pc"))

    def geneInfo(self, gene):
        r = self.pw.fetchoneAsNamedTuples("pg$geneInfo", """
        SELECT *
        FROM {gtn}
        WHERE approved_symbol = %s
        OR ensemblid = %s
        OR ensemblid_ver = %s
        OR info->>'symbol' = %s
        """.format(gtn=self.assembly + "_gene_info"),
                                          (gene, gene, gene, gene))
        return r

    def intersectingSnps(self, accession, coord, halfWindow):
        c = coord.expanded(halfWindow)
        rows = self.pw.fetchall("intersectingSnps", """
        SELECT start, stop, snp
        FROM {tn}
        WHERE chrom = %s
        AND int4range(start, stop) && int4range(%s, %s)
        """.format(tn=self.assembly + "_snps"),
                                (c.chrom, c.start, c.end))

        ret = []
        for snp in rows:
            start = snp[0]
            end = snp[1]
            ret.append({"chrom": c.chrom,
                        "cre_start": coord.start,
                        "cre_end": coord.end,
                        "accession": accession,
                        "snp_start": start,
                        "snp_end": end,
                        "name": snp[2],
                        "distance": min(abs(coord.end - end),
                                        abs(coord.start - start))})
        return ret

    def nearbyCREs(self, coord, halfWindow, cols, isProximalOrDistal):
        c = coord.expanded(halfWindow)
        
        tableName = self.assembly + "_cre_all"
        q = """
SELECT {cols} FROM {tn} INNER JOIN {ttn} ON {tn}.accession = {ttn}.accession
WHERE chrom = %s
AND int4range(start, stop) && int4range(%s, %s)
""".format(cols=','.join(cols),
           tn=tableName,
           ttn = self.assembly + "_ccres_toptier")

        if isProximalOrDistal is not None:
            q += """
AND isProximal is {isProx}
""".format(isProx=str(isProximalOrDistal))

        rows = self.pw.fetchall("nearbyCREs",
                                q, (c.chrom, c.start, c.end))
        return rows

    def distToNearbyCREs(self, accession, coord, halfWindow):
        cols = ["start", "stop",
                self.assembly + "_cre_all.accession AS accession"]
        cres = self.nearbyCREs(coord, halfWindow, cols, None)
        ret = []
        for c in cres:
            acc = c[2]
            if acc == accession:
                continue
            start = c[0]
            end = c[1]
            ret.append({"name": acc,
                        "distance": min(abs(coord.end - end),
                                        abs(coord.start - start))})
        return ret

    def cresInTad(self, accession, chrom, start):
        rows = self.pw.fetchall("cresInTad", """
        SELECT {cre}.accession AS accession, abs(%s - start) AS distance
        FROM {cre} INNER JOIN {ttn} ON {cre}.accession = {ttn}.accession
        WHERE chrom = %s
        AND int4range(start, stop) && int4range(
        (SELECT int4range(min(start), max(stop))
        FROM {ti} ti
        inner join {tads} tads
        on ti.tadname = tads.tadname
        WHERE accession = %s))
        AND abs(%s - start) < 100000
        ORDER BY 2
        """.format(cre=self.assembly + "_cre_all",
                   ttn = self.assembly + "_ccres_toptier",
                   ti=self.assembly + "_tads_info",
                   tads=self.assembly + "_tads"),
                                (start, chrom, accession, start))
        frows = [x for x in rows if x[0] != accession]
        return [{"accession": r[0], "distance": r[1]} for r in frows]

    def genesInTad(self, accession, chrom):
        rows = self.pw.fetchall("genesInTad", """
        SELECT geneIDs
        FROM {tn}
        WHERE accession = %s
        """.format(tn=self.assembly + "_tads"), (accession, ))
        return rows

    def rankMethodToIDxToCellType(self):
        pg = PGcommon(self.pw, self.assembly)
        return pg.rankMethodToIDxToCellType()

    def rankMethodToCellTypes(self):
        rows = self.pw.fetchall("pg$getRanIdxToCellType", """
        SELECT idx, celltype, rankmethod
        FROM {assembly}_rankcelltypeindexex
        """.format(assembly=self.assembly))
        _map = {}
        for r in rows:
            _map[r[2]] = [(r[0], r[1])] if r[2] not in _map else _map[r[2]] + [(r[0], r[1])]
        ret = {}
        for k, v in _map.items():
            ret[k] = [x[1] for x in sorted(v, key=lambda a: a[0])]
            #print(k, ret[k])
        #print(ret.keys())
        # ['Enhancer', 'H3K4me3', 'H3K27ac', 'Promoter', 'DNase', 'Insulator', 'CTCF']
        return ret

    def _getColsForAccession(self, accession, chrom, cols):
        row = self.pw.fetchone("_getColsForAccession", """
        SELECT {cols}
        FROM {tn}
        WHERE accession = %s
        """.format(cols=','.join(cols),
                   tn=self.assembly + "_cre_all"), (accession,))
        return row

    def creRanksPromoter(self, accession, chrom):
        cols = ["promoter_zscores"]
        r = self._getColsForAccession(accession, chrom, cols)
        return {"zscores": {"Promoter": r[0]}}

    def creRanksEnhancer(self, accession, chrom):
        cols = ["enhancer_zscores"]
        r = self._getColsForAccession(accession, chrom, cols)
        return {"zscores": {"Enhancer": r[0]}}

    def creRanks(self, accession, chrom):
        cols = """dnase_zscores
        ctcf_zscores
        enhancer_zscores
        h3k27ac_zscores
        h3k4me3_zscores
        insulator_zscores
        promoter_zscores
        dnase_max
        h3k4me3_max
        h3k27ac_max
        ctcf_max
        pct""".split('\n')
        cols = [c.strip() for c in cols]
        r = self._getColsForAccession(accession, chrom, cols)
        group = r[-1]; r = r[:-1]
        cols = [c.split('_')[0] if "max" not in c else c for c in cols][:-1]
        return ( dict(list(zip(cols, r))), group )

    def creMostsimilar(self, acc, assay, threshold=20000):
        if self.assembly == "hg19":
            return []

        def whereclause(r):
            _assay = assay
            if assay != "dnase":
                _assay = assay.replace("_dnase", "") + "_only"

            return " or ".join(["%s_rank[%d] < %d" % (_assay, i + 1, threshold)
                                for i in range(len(r)) if r[i] < threshold])

        r = self.pw.fetchone("cre$CRE::mostsimilar", """
        SELECT {assay}_rank
        FROM {assembly}_cre_all
        WHERE accession = %s
        """.format(assay=assay,
                   assembly=self.assembly), acc)

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

        rows = self.pw.fetchall("pg_search", """
        SELECT accession,
        intarraysimilarity(%(r)s, {assay}_rank, {threshold}) AS similarity,
        chrom, start, stop
        FROM {assembly}_cre_all
        WHERE {whereclause}
        ORDER BY similarity DESC LIMIT 10
        """.format(assay=assay,
                   assembly=self.assembly,
                   threshold=threshold,
                   whereclause=whereclause), {"r": r})

        return [{"accession": r[0], "chrom": r[2], "start": r[3], "end": r[4]}
                for r in rows]

    def _intersections_tablename(self, metadata=False, eset=None):
        if eset not in [None, "cistrome", "peak"]:
            raise Exception("pg$PGSearch::_intersections_tablename: invalid dataset %s" % eset)
        if eset is None:
            eset = "peak"
        return eset + "Intersections" + ("" if not metadata else "Metadata")

    def peakIntersectCount(self, accession, chrom, totals, eset=None):
        r = self.pw.fetchone("peakIntersectCount", """
        SELECT tf, histone
        FROM {tn}
        WHERE accession = %s
        """.format(tn=self.assembly + "_" +
                   self._intersections_tablename(eset=eset)),
                             (accession,))
        if not r:
            return {"tfs": [], "histone": []}
        tfs = [{"name": k, "n": len(set(v)), "total": totals.get(k, -1)}
               for k, v in r[0].items()]
        histones = [{"name": k, "n": len(set(v)), "total": totals.get(k, -1)}
                    for k, v in r[1].items()]
        return {"tf": tfs, "histone": histones}

    def tfHistoneDnaseList(self, eset=None):
        rows = self.pw.fetchall("peakIntersectCount", """
        SELECT distinct label
        FROM {tn}
        """.format(tn=self.assembly + "_" +
                   self._intersections_tablename(metadata=True, eset=eset)))
        return sorted([r[0] for r in rows])

    def genePos(self, gene):
        ensemblid = gene
        if gene.startswith("ENS") and '.' in gene:
            ensemblid = gene.split('.')[0]

        r = self.pw.fetchone("cre_pos", """
        SELECT chrom, start, stop, info->>'symbol' AS approved_symbol, ensemblid_ver FROM {tn}
        WHERE chrom != ''
        AND (approved_symbol = %s
        OR ensemblid = %s
        OR ensemblid_ver = %s
        OR info->>'symbol' = %s)
        """.format(tn=self.assembly + "_gene_info"),
                             (gene, ensemblid, gene, gene))
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

        cols = ["assay", "expID", "fileID", "tissue",
                "biosample_summary", "biosample_type", "cellTypeName",
                "cellTypeDesc", "synonyms"]
        rows = self.pw.fetchall("datasets", """
        SELECT {cols} FROM {tn}
        """.format(tn=self.assembly + "_datasets",
                   cols=','.join(cols)))

        return [makeDataset(r) for r in rows]

    def datasets(self, assay):
        return self.pgc.datasets(assay)

    def genemap(self):
        rows = self.pw.fetchall("pg::genemap", """
        SELECT ensemblid, info->>'symbol' AS approved_symbol, strand
        FROM {tn}
        WHERE strand != ''
        """.format(tn=self.assembly + "_gene_info"))
        toSymbol = {r[0]: r[1] for r in rows}
        toStrand = {r[0]: r[2] for r in rows}

        rows = self.pw.fetchall("pg::genemap", """
        SELECT ensemblid_ver, info->>'symbol' AS approved_symbol, strand
        FROM {tn}
        WHERE strand != ''
        """.format(tn=self.assembly + "_gene_info"))
        toSymbol.update({r[0]: r[1] for r in rows})
        toStrand.update({r[0]: r[2] for r in rows})
        
        return toSymbol, toStrand

    def genesInRegion(self, chrom, start, stop):
        fields = ["approved_symbol", "start", "stop", "strand"]
        rows = self.pw.fetchall("genesinregion", """
        SELECT {fields}
        FROM {tn}
        WHERE chrom = %s
        AND int4range(start, stop) && int4range(%s, %s)
        ORDER BY start
        """.format(fields=','.join(fields), tn=self.assembly + "_gene_info"),
                                (chrom, start, stop))
        fields = ["gene", "start", "stop", "strand"]
        return [dict(list(zip(fields, r))) for r in rows]

    def histoneTargetExps(self, accession, target, eset=None):
        peakTn = self.assembly + "_" + self._intersections_tablename(eset=eset)
        peakMetadataTn = self.assembly + "_" + self._intersections_tablename(metadata=True, eset=eset)

        rows = self.pw.fetchall("histoneTargetExps", """
        SELECT {eid}fileID, biosample_term_name{tissue}
        FROM {peakMetadataTn}
        WHERE fileID IN (
        SELECT distinct(jsonb_array_elements_text(histone->%s))
        FROM {peakTn}
        WHERE accession = %s
        )
        ORDER BY biosample_term_name
        """.format(eid=("" if eset == "cistrome" else "expID, "),
                   tissue=(", tissue" if eset == "cistrome" else ""),
                   peakTn=peakTn,
                   peakMetadataTn=peakMetadataTn),
                                (target, accession))
        return [{"expID": r[0] if eset == "cistrome" else (r[0] + ' / ' + r[1]),
                 "biosample_term_name": r[1 if (eset == "cistrome" and r[1] != "None") else 2]} for r in rows]

    def tfTargetExps(self, accession, target, eset=None):
        peakTn = self.assembly + "_" + self._intersections_tablename(metadata=False, eset=eset)
        peakMetadataTn = self.assembly + "_" + self._intersections_tablename(metadata=True, eset=eset)

        rows = self.pw.fetchall("tfTargetExps", """
        SELECT {eid}fileID, biosample_term_name
        FROM {peakMetadataTn}
        WHERE fileID IN (
        SELECT distinct(jsonb_array_elements_text(tf->%s))
        FROM {peakTn}
        WHERE accession = %s
        )
        ORDER BY biosample_term_name
        """.format(eid="" if eset == "cistrome" else "expID, ",
                   peakTn=peakTn,
                   peakMetadataTn=peakMetadataTn),
                                (target, accession))
        return [{"expID": r[0] if eset == "cistrome" else (r[0] + ' / ' + r[1]),
                 "biosample_term_name": r[1 if eset == "cistrome" else 2]} for r in rows]

    def rampageByGene(self, ensemblid_ver):
        rows = self.pw.fetchallAsDict("rampageByGene", """
        SELECT *
        FROM {tn}
        WHERE ensemblid_ver ILIKE %s || '%%'
        """.format(tn=self.assembly + "_rampage"),
                                      (ensemblid_ver.split('.')[0], ))

        ret = []
        for r in rows:
            nr = {"data": {}}
            for k, v in r.items():
                if k.startswith("encff"):
                    nr["data"][k] = v
                    continue
                nr[k] = v
            if not nr["data"]:
                continue
            ret.append(nr)
        return ret

    def rampage_info(self):
        rows = self.pw.fetchallAsDict("rampageInfo", """
        SELECT *
        FROM {tn}
        """.format(tn=self.assembly + "_rampage_info"))
        ret = {}
        for r in rows:
            ret[r["fileid"]] = r
        return ret

    def rampageEnsemblID(self, gene):
        r = self.pw.fetchone("rampageEnsemblID", """
        SELECT ensemblid_ver 
        FROM {assembly}_gene_info
        WHERE approved_symbol = %(gene)s OR info->>'symbol' = %(gene)s
        """.format(assembly=self.assembly),
                             {"gene": gene})
        return r[0]

    def geBiosampleTypes(self):
        rows = self.pw.fetchall("geBiosampleTypes", """
        SELECT DISTINCT(biosample_type)
        FROM {tn}
        ORDER BY 1
        """.format(tn=self.assembly + "_rnaseq_exps"))
        return [r[0] for r in rows]

    def geneIDsToApprovedSymbol(self):
        rows = self.pw.fetchall("geneIDsToApprovedSymbol", """
        SELECT geneid, info->>'symbol' AS approved_symbol
        FROM {gtn}
        ORDER BY 1
        """.format(gtn=self.assembly + "_gene_info"))
        return {r[0]: r[1] for r in rows}

    def genePGIDsToApprovedSymbol(self):
        rows = self.pw.fetchall("geneIDsToApprovedSymbol", """
        SELECT id, info->>'symbol' AS approved_symbol
        FROM {gtn}
        ORDER BY 1
        """.format(gtn=self.assembly + "_gene_info"))
        return {r[0]: r[1] for r in rows}

    def getHelpKeys(self):
        rows = self.pw.fetchall("getHelpKeys", """
        SELECT key, title, summary
        FROM helpkeys
        """)
        return {r[0]: {"title": r[1],
                       "summary": r[2]}
                for r in rows}

    def tfHistCounts(self, eset=None):
        if eset is None:
            eset = "peak"
        rows = self.pw.fetchall("tfHistCounts", """
        SELECT COUNT(label), label
        FROM {assembly}_{eset}intersectionsmetadata
        GROUP BY label
        """.format(assembly=self.assembly, eset=eset))
        return {r[1]: r[0] for r in rows}

    def geneExpressionTissues(self):
        rows = self.pw.fetchall("geneExpressionTissues", """
        SELECT DISTINCT(organ)
        FROM {assembly}_rnaseq_exps
        """.format(assembly=self.assembly))
        return [r[0] for r in rows]

    def loadNineStateGenomeBrowser(self):
        rows = self.pw.fetchallAsDict("loadNineStateGenomeBrowser", """
        SELECT cellTypeName, cellTypeDesc, dnase, h3k4me3, 
        h3k27ac, ctcf, assembly, tissue
        FROM {tn}
        """.format(tn=self.assembly + "_nine_state"))
        
        ret = {}
        for r in rows:
            for k in ["dnase", "h3k4me3", "h3k27ac", "ctcf"]:
                fileID = r[k]
                if "NA" == fileID:
                    url = ""
                else:
                    fn = fileID + ".bigBed.bed.gz"
                    url = "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/9-State/" + fn
                r[k + "_url"] = url
            ret[r["celltypename"]] = r
        return ret

    def loadMoreTracks(self):
        rows = self.pw.fetchall("loadMoreTracks", """
        SELECT cellTypeName, tracks
        FROM {tn}
        """.format(tn=self.assembly + "_more_tracks"))

        ret = {}
        for r in rows:
            ret[r[0]] = r[1]
        return ret

    def linkedGenes(self, accession):
        rows = self.pw.fetchallAsDict("linkedGenes", """
        SELECT gene, celltype, method, dccaccession
        FROM {tn}
        WHERE cre = %s
        """.format(tn=self.assembly + "_linked_genes"),
                                          (accession, ))
        return rows

    def creBigBeds(self):
        rows = self.pw.fetchall("creBigBeds", """
        SELECT celltype, dcc_accession, typ
        FROM {tn}
        """.format(tn=self.assembly + "_dcc_cres"))
        ret = {}
        for ct, acc, typ in rows:
            if ct not in ret:
                ret[ct] = {}
            ret[ct][typ] = acc
        return ret

    def creBeds(self):
        rows = self.pw.fetchall("creBeds", """
        SELECT celltype, dcc_accession, typ
        FROM {tn}
        """.format(tn=self.assembly + "_dcc_cres_beds"))

        ret = {}
        for ct, acc, typ in rows:
            if ct not in ret:
                ret[ct] = {}
            ret[ct][typ] = acc
        return ret

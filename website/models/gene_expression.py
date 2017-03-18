from __future__ import print_function

import sys, os, json

from itertools import groupby
from scipy.stats.mstats import mquantiles
import numpy as np
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from models.tissue_colors import TissueColors

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor

class GeneExpression:
    def __init__(self, ps, cacheW, assembly):
        self.ps = ps
        self.cacheW = cacheW
        self.assembly = assembly
        self.tissueColors = TissueColors(cacheW[assembly])

    def getTissueColor(self, t):
        return self.tissueColors.getTissueColor(t)

    def groupByTissue(self, rows):
        sorter = lambda x: x["tissue"]
        rows.sort(key = sorter)

        ret = {}
        for row in rows:
            t = row["tissue"]
	    if t not in ret:
                c = self.getTissueColor(t)
	        ret[t] = {"name" : t,
                          "displayName" : t,
                          "color": c,
                          "items": []}
            ret[t]["items"].append(row)
        return ret

    def groupByTissueMax(self, rows, skey):
        sorter = lambda x: x["tissue"]
        rows.sort(key = sorter)

        ret = {}
        for row in rows:
            t = row["tissue"]
	    if t not in ret:
                c = self.getTissueColor(t)
	        ret[t] = {"name" : t,
                          "displayName" : t,
                          "color": c,
                          "items": [row]}
            else:
                if ret[t]["items"][0][skey] < row[skey]:
                    ret[t]["items"][0] = row

        rows = ret.values()
        sorter = lambda x: float(x["items"][0][skey])
        rows.sort(key = sorter, reverse = True)

        ret = {}
        for idx, row in enumerate(rows):
            t = row["name"]
            k = str(idx).zfill(3) + '_' + t
	    ret[k] = row
        return ret

    def sortByExpression(self, rows, key):
        sorter = lambda x: float(x[key])
        rows.sort(key = sorter, reverse = True)

        ret = {}
        for idx, row in enumerate(rows):
            t = row["tissue"]
            c = self.getTissueColor(t)
            k = str(idx).zfill(3) + '_' + t
	    ret[k] = {"name" : k,
                      "displayName" : t,
                      "color": c,
                      "items": [row]}
        return ret

    def process(self, rows):
        return {"byTissue" : self.groupByTissue(rows),
                "byTissueMaxTPM" : self.groupByTissueMax(rows, "rawTPM"),
                "byTissueMaxFPKM" : self.groupByTissueMax(rows, "rawFPKM"),
                "byExpressionTPM" : self.sortByExpression(rows, "rawTPM"),
                "byExpressionFPKM" : self.sortByExpression(rows, "rawFPKM")}

    def computeFoldChange(self, ct1, ct2):
        ct1 = ct1.replace("_", " ")
        ct2 = ct2.replace("_", " ")
        exp = {ct1: {}, ct2: {}}
        fc = {}
        counts = {ct1: {}, ct2: {}}
        with getcursor(self.ps.DBCONN, "ComputeGeneExpression::computeFoldChange") as curs:
            curs.execute("""
SELECT r.tpm, r.fpkm, r_rnas_{assembly}.cellType, r.gene_name
FROM r_expression_{assembly} as r
INNER JOIN r_rnas_{assembly} ON r_rnas_{assembly}.encode_id = r.dataset
WHERE r_rnas_{assembly}.cellType = %(ct1)s OR r_rnas_{assembly}.cellType = %(ct2)s
""".format(assembly = self.assembly),
                         {"ct1": ct1, "ct2": ct2})
            rows = curs.fetchall()
        for row in rows:
            if row[3] not in exp[row[2]]: exp[row[2]][row[3]] = 0.0
            exp[row[2]][row[3]] += float(row[0])
            if row[3] not in counts[row[2]]: counts[row[2]][row[3]] = 0.0
            counts[row[2]][row[3]] += 1.0
        for ct in [ct1, ct2]:
            for gene in exp[ct]:
                exp[ct][gene] /= counts[ct][gene]
        for gene in exp[ct1]:
            if gene in exp[ct2]:
                fc[gene] = math.log((exp[ct1][gene] + 0.01) / (exp[ct2][gene] + 0.01), 2)
        return fc

    def computeHorBars(self, gene, compartments, biosample_types_selected):
        q = """
SELECT r.tpm, r_rnas_{assembly}.organ, r_rnas_{assembly}.cellType,
r.dataset, r.replicate, r.fpkm
FROM r_expression_{assembly} AS r
INNER JOIN r_rnas_{assembly} ON r_rnas_{assembly}.encode_id = r.dataset
WHERE gene_name = %(gene)s
AND r_rnas_{assembly}.cellCompartment IN %(compartments)s
AND r_rnas_{assembly}.biosample_type IN %(bts)s
""".format(assembly = self.assembly)
        #print(q, gene)
        with getcursor(self.ps.DBCONN, "_gene") as curs:
            curs.execute(q, { "gene" : gene,
                              "compartments" : tuple(compartments),
                              "bts" : tuple(biosample_types_selected)})
            rows = curs.fetchall()

        if not rows:
            return {"hasData" : False, "items" : {}}

        def makeEntry(row):
            base = 2
            tissue = row[1].strip()

            if tissue == '{}':
                tissue = fixedmap[row[2]] if row[2] in fixedmap else ""
            return {"tissue" : tissue,
                    "cellType" : row[2],
                    "rawTPM" : row[0],
                    "logTPM" : "{0:.2f}".format(math.log(float(row[0]) + 0.01, base)),
                    "rawFPKM" : row[5],
                    "logFPKM" : "{0:.2f}".format(math.log(float(row[5]) + 0.01, base)),
                    "expID" : row[3],
                    "rep" : row[4]}

        rows = [makeEntry(x) for x in rows]
        ret = {"hasData" : True,
               "items" : self.process(rows)}
        return ret


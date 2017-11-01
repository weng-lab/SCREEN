from __future__ import print_function

import sys
import os
import json

from itertools import groupby
from scipy.stats.mstats import mquantiles
import numpy as np
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from models.tissue_colors import TissueColors

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor


class GeneExpression:
    def __init__(self, ps, cache, assembly):
        self.ps = ps
        self.cache = cache
        self.assembly = assembly
        self.tissueColors = TissueColors(cache)

        self.itemsByRID = {}
        
    def getTissueColor(self, t):
        return self.tissueColors.getTissueColor(t)

    def groupByTissue(self, rows, skey):
        def sorter(x):
            # sort by tissue, then TPM/FPKM descending
            return (x["tissue"], -1.0 * float(x[skey]))
        rows.sort(key=sorter)

        ret = {}
        for row in rows:
            if row["rID"] not in self.itemsByRID:
                self.itemsByRID[row["rID"]] = row
            t = row["tissue"]
            if t not in ret:
                c = self.getTissueColor(t)
                ret[t] = {"name": t,
                          "displayName": t,
                          "color": c,
                          "items": []}
            ret[t]["items"].append(row["rID"])
        return ret

    def groupByTissueMax(self, rows, skey):
        def sorter(x): return x["tissue"]
        rows.sort(key=sorter)

        ret = {}
        for row in rows:
            if row["rID"] not in self.itemsByRID:
                self.itemsByRID[row["rID"]] = row
            t = row["tissue"]
            if t not in ret:
                c = self.getTissueColor(t)
                ret[t] = {"name": t,
                          "displayName": t,
                          "color": c,
                          "items": [row]}
            else:
                if ret[t]["items"][0][skey] < row[skey]:
                    ret[t]["items"][0] = row

        rows = ret.values()

        def sorter(x):
            return float(x["items"][0][skey])
        rows.sort(key=sorter, reverse=True)

        ret = {}
        for idx, row in enumerate(rows):
            t = row["name"]
            k = str(idx).zfill(3) + '_' + t
            ret[k] = row
            ret[k]["items"] = map(lambda x: x["rID"], row["items"])
        return ret

    def sortByExpression(self, rows, key):
        def sorter(x):
            return float(x[key])
        rows.sort(key=sorter, reverse=True)

        ret = {}
        for idx, row in enumerate(rows):
            if row["rID"] not in self.itemsByRID:
                self.itemsByRID[row["rID"]] = row
            t = row["tissue"]
            c = self.getTissueColor(t)
            k = str(idx).zfill(3) + '_' + t
            ret[k] = {"name": k,
                      "displayName": t,
                      "color": c,
                      "items": [row["rID"]]}
        return ret

    def process(self, rows):
        return {"byTissueTPM": self.groupByTissue(rows, "rawTPM"),
                "byTissueFPKM": self.groupByTissue(rows, "rawFPKM"),
                "byTissueMaxTPM": self.groupByTissueMax(rows, "rawTPM"),
                "byTissueMaxFPKM": self.groupByTissueMax(rows, "rawFPKM"),
                "byExpressionTPM": self.sortByExpression(rows, "rawTPM"),
                "byExpressionFPKM": self.sortByExpression(rows, "rawFPKM")}

    def doComputeHorBars(self, q, gene, compartments, biosample_types_selected):
        a = """
SELECT chrom, start, stop 
FROM {assembly}_gene_info
WHERE approved_symbol = %(gene)s
""".format(assembly=self.assembly)

        #print(q, gene)
        with getcursor(self.ps.DBCONN, "_gene") as curs:
            curs.execute(q, {"gene": gene,
                             "compartments": tuple(compartments),
                             "bts": tuple(biosample_types_selected)})
            rows = curs.fetchall()
            curs.execute(a, {"gene": gene})
            grows = curs.fetchall()

        if not rows or not grows:
            return {}

        def makeEntry(row):
            base = 2
            tissue = row[1].strip()

            if tissue == '{}':
                tissue = fixedmap[row[2]] if row[2] in fixedmap else ""
            return {"tissue": tissue,
                    "cellType": row[2],
                    "rawTPM": float(row[0]),  # built-in JSON encoder doesn't know Decimal type
                    "logTPM": "{0:.2f}".format(math.log(float(row[0]) + 0.01, base)),
                    "rawFPKM": float(row[5]),
                    "logFPKM": "{0:.2f}".format(math.log(float(row[5]) + 0.01, base)),
                    "expID": row[3],
                    "rep": row[4],
                    "ageTitle": row[6],
                    "rID": row[7]
            }

        rows = [makeEntry(x) for x in rows]
        ret = self.process(rows)
        return ret


    def computeHorBars(self, gene, compartments, biosample_types_selected):
        q = """
SELECT r.tpm, r_rnas_{assembly}.organ, r_rnas_{assembly}.cellType,
r.dataset, r.replicate, r.fpkm, r_rnas_{assembly}.ageTitle, r.id
FROM r_expression_{assembly} AS r
INNER JOIN r_rnas_{assembly} ON r_rnas_{assembly}.encode_id = r.dataset
WHERE gene_name = %(gene)s
AND r_rnas_{assembly}.cellCompartment IN %(compartments)s
AND r_rnas_{assembly}.biosample_type IN %(bts)s
""".format(assembly=self.assembly)
        return self.doComputeHorBars(q, gene, compartments, biosample_types_selected)
    
    def computeHorBarsMean(self, gene, compartments, biosample_types_selected):
        q = """
SELECT avg(r.tpm), r_rnas_{assembly}.organ, r_rnas_{assembly}.cellType,
r.dataset, 'mean' as replicate, avg(r.fpkm), r_rnas_{assembly}.ageTitle, 
array_to_string(array_agg(r.id), ',')
FROM r_expression_{assembly} AS r
INNER JOIN r_rnas_{assembly} ON r_rnas_{assembly}.encode_id = r.dataset
WHERE gene_name = %(gene)s
AND r_rnas_{assembly}.cellCompartment IN %(compartments)s
AND r_rnas_{assembly}.biosample_type IN %(bts)s
GROUP BY r_rnas_{assembly}.organ, r_rnas_{assembly}.cellType, r.dataset, r_rnas_{assembly}.ageTitle
""".format(assembly=self.assembly)
        return self.doComputeHorBars(q, gene, compartments, biosample_types_selected)

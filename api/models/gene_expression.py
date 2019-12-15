

import sys
import os
import json

from itertools import groupby
import numpy as np
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '../'))
from models.tissue_colors import TissueColors

sys.path.append(os.path.join(os.path.dirname(__file__), '../common'))
from table_names import GeData, GeMetadata
from config import Config


class GeneExpression:
    def __init__(self, pw, cache, assembly):
        self.pw = pw
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

        rows = list(ret.values())

        def sorter(x):
            return float(x["items"][0][skey])
        rows.sort(key=sorter, reverse=True)

        ret = {}
        for idx, row in enumerate(rows):
            t = row["name"]
            k = str(idx).zfill(3) + '_' + t
            ret[k] = row
            ret[k]["items"] = [x["rID"] for x in row["items"]]
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

    def doComputeHorBars(self, q, gene, compartments, biosample_types_selected,
                         assay_name = None):
        #print(q, gene)
        args = {"gene": gene,
                "compartments": tuple(compartments),
                "bts": tuple(biosample_types_selected)}
        if assay_name is not None:
            args["an"] = assay_name
        rows = self.pw.fetchall("doComputeHorBars", q, args)

        a = """
        SELECT chrom, start, stop
        FROM {assembly}_gene_info
        WHERE approved_symbol = %(gene)s
        """.format(assembly=self.assembly)
        grows = self.pw.fetchall("doComputeHorBars", a, {"gene": gene})

        if not rows or not grows:
            return {}

        def makeEntry(row):
            tissue = row[1].strip()

            def doLog(d):
                base = 2
                return float("{0:.2f}".format(math.log(float(d) + 0.01, base)))

            if tissue == '{}':
                tissue = fixedmap[row[2]] if row[2] in fixedmap else ""

            # built-in JSON encoder missing Decimal type, so cast to float
            return {"tissue": tissue,
                    "cellType": row[2],
                    "rawTPM": float(row[0]),
                    "logTPM": doLog(row[0]),
                    "rawFPKM": float(row[5]),
                    "logFPKM": doLog(row[5]),
                    "expID": row[3],
                    "rep": row[4],
                    "ageTitle": row[6],
                    "rID": row[7]
                    }

        rows = [makeEntry(x) for x in rows]
        ret = self.process(rows)
        return ret

    def computeHorBars(self, gene, compartments, biosample_types_selected,
                       assay_name = None):
        assayname = ""
        if assay_name is not None:
            assayname = """
AND {tableNameMetadata}.assay_title = %(an)s
""".format(assembly = self.assembly,
           tableNameMetadata = GeMetadata(self.assembly))
            
        q = """
        SELECT r.tpm, {tableNameMetadata}.organ, {tableNameMetadata}.cellType,
        r.expid, r.replicate, r.fpkm, {tableNameMetadata}.ageTitle, r.id
        FROM {tableNameData} AS r
        INNER JOIN {tableNameMetadata} ON {tableNameMetadata}.expid = r.expid
        {assayname}
        WHERE gene_name = %(gene)s
        AND {tableNameMetadata}.cellCompartment IN %(compartments)s
        AND {tableNameMetadata}.biosample_type IN %(bts)s
        """.format(assembly=self.assembly,
                   tableNameData = GeData(self.assembly, Config.rnaSeqIsNorm),
                   tableNameMetadata = GeMetadata(self.assembly),
                   assayname = assayname)
        
        return self.doComputeHorBars(q, gene, compartments,
                                     biosample_types_selected, assay_name)

    def computeHorBarsMean(self, gene, compartments, biosample_types_selected,
                           assay_name = None):
        assayname = ""
        if assay_name is not None:
            assayname = """
AND {tableNameMetadata}.assay_title = %(an)s
""".format(assembly = self.assembly,
           tableNameMetadata = GeMetadata(self.assembly))
           
        q = """
SELECT avg(r.tpm), {tableNameMetadata}.organ, {tableNameMetadata}.cellType,
r.expid, 'mean' as replicate, avg(r.fpkm), {tableNameMetadata}.ageTitle,
array_to_string(array_agg(r.id), ',')
FROM {tableNameData} AS r
INNER JOIN {tableNameMetadata} ON {tableNameMetadata}.expid = r.expid
{assayname}
WHERE gene_name = %(gene)s
AND {tableNameMetadata}.cellCompartment IN %(compartments)s
AND {tableNameMetadata}.biosample_type IN %(bts)s
GROUP BY {tableNameMetadata}.organ, {tableNameMetadata}.cellType, r.expid,
{tableNameMetadata}.ageTitle
""".format(assembly=self.assembly,
           tableNameData = GeData(self.assembly, Config.rnaSeqIsNorm),
           tableNameMetadata = GeMetadata(self.assembly),
           assayname = assayname)
        return self.doComputeHorBars(q, gene, compartments, biosample_types_selected, assay_name)

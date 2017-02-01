import sys, os, json

from itertools import groupby
from scipy.stats.mstats import mquantiles
import numpy as np
import random
import math

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor

FixedTissueColors = {
    "ESC": "#77FF44",
    "blood": "#880000",
    "bone marrow": "#AACCAA",
    "brain": "#AA8888",
    "breast": "#33AA00",
    "colon": "#AAAA55",
    "embryonic structure": "#AAAAFF",
    "eye": "#6600CC",
    "fat": "#FFFF55",
    "heart": "#880055",
    "intestine": "#9900AA",
    "kidney": "#77AABB",
    "liver": "#884400",
    "lung": "#CCCCCC",
    "mammary": "#991111",
    "muscle": "#119911",
    "pancreas": "#AA88AA",
    "placenta": "#FF9977",
    "prostate": "#00AA88",
    "skin": "#BBAA44",
    "stomach": "#44AAFF",
    "uterus": "#990033",
    'adrenal gland' : "#BBAA44", 
    'blood vessel' : '#880000',
    'bone' : "#BBAA44",
    'bronchus' : "#BBAA44",
    'cartilage' : "#BBAA44",
    'connective tissue' : "#BBAA44",
    'esophagus' : "#BBAA44",
    'extraembryonic structure' : "#BBAA44",
    'gonad' : "#BBAA44",
    'iPSC' : "#BBAA44",
    'large intestine' : "#BBAA44",
    'lymphoid' : "#BBAA44",
    'mammary gland' : "#BBAA44",
    'mouth' : "#BBAA44",
    'muscle organ' : "#BBAA44",
    'myometrium' : "#BBAA44",
    'nervous system' : "#BBAA44",
    'olfactory organ' : "#BBAA44",
    'prostate gland' : "#00AA88",
    'skin of body' : "#BBAA44",
    'spinal cord' : "#BBAA44",
    'spleen' : "#BBAA44",
    'thyroid gland' : "#BBAA44",
    'trachea' : "#BBAA44",
    'urinary bladder' : "#BBAA44",
    'vagina' : "#BBAA44"
}

fixedmap = {"limb": "limb",
            "embryonic facial prominence": "embryonic structure",
            "CH12.LX": "blood",
            "neural tube": "neural tube",
            "intestine": "intestine",
            "hematopoietic stem cell": "blood",
            "G1E": "embryonic stem cell",
            "MEP": "blood",
            "G1E-ER4": "embryonic stem cell",
            "CMP": "blood" }

Compartments = ["cell", "nucleoplasm", "cytosol",
                "nucleus", "membrane", "chromatin", 
                "nucleolus"]

class TissueColors:
    def __init__(self):
        self.randColorGen = lambda: random.randint(0,255)
        self.tissueColors = {}

    def randColor(self):
        return '#%02X%02X%02X' % (self.randColorGen(),
                                  self.randColorGen(),
                                  self.randColorGen())

    def getTissueColor(self, t):
        if t in FixedTissueColors:
            return FixedTissueColors[t]
        if t not in self.tissueColors:
            self.tissueColors[t] = self.randColor()
        return self.tissueColors[t]

class ComputeGeneExpression:
    def __init__(self, es, ps, cache, assembly):
        self.es = es
        self.ps = ps
        self.cache = cache
        self.assembly = assembly
        self.tissueColors = TissueColors()
                
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

    def groupByTissueMax(self, rows, key):
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
                if ret[t]["items"][0][key] < row[key]:
                    ret[t]["items"][0] = row

        rows = ret.values()
        sorter = lambda x: x["items"][0][key]
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
        print(fc)
        return fc
                
    def computeHorBars(self, gene, compartments):
        print(tuple(compartments))
        with getcursor(self.ps.DBCONN, "_gene") as curs:
            curs.execute("""
            SELECT r.tpm, r_rnas_{assembly}.organ, r_rnas_{assembly}.cellType, r.dataset, r.replicate, r.fpkm
            FROM r_expression_{assembly} AS r
            INNER JOIN r_rnas_{assembly} ON r_rnas_{assembly}.encode_id = r.dataset
            WHERE gene_name = %(gene)s
            AND r_rnas_{assembly}.cellCompartment IN %(compartments)s
            """.format(assembly = self.assembly),
                         { "gene" : gene,
                           "compartments" : tuple(compartments)})
            rows = curs.fetchall()

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
        return {"items" : self.process(rows)}
        

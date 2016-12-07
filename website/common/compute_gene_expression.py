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
    def __init__(self, es, ps, cache):
        self.es = es
        self.ps = ps
        self.cache = cache
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
    
    def computeHorBars(self, gene, compartments):
        with getcursor(self.ps.DBCONN, "_gene") as curs:
            curs.execute("""
            SELECT r.tpm, r_rnas.organ, r_rnas.cellType, r.dataset, r.replicate, r.fpkm
            FROM r_expression AS r
            INNER JOIN r_rnas ON r_rnas.encode_id = r.dataset
            WHERE gene_name = %(gene)s
            AND r_rnas.cellCompartment IN %(compartments)s
            """,
                         { "gene" : gene,
                           "compartments" : tuple(compartments)})
            rows = curs.fetchall()

        def makeEntry(row):
            base = 2
            return {"tissue" : row[1].strip(),
                    "cellType" : row[2],
                    "rawTPM" : row[0],
                    "logTPM" : "{0:.2f}".format(math.log(float(row[0]) + 0.01, base)),
                    "rawFPKM" : row[5],
                    "logFPKM" : "{0:.2f}".format(math.log(float(row[5]) + 0.01, base)),
                    "expID" : row[3],
                    "rep" : row[4]}
                
        rows = [makeEntry(x) for x in rows]
        return {"items" : self.process(rows)}
        

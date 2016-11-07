import sys, os, json

from itertools import groupby
from scipy.stats.mstats import mquantiles
import numpy as np

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor

TissueColors = {
    "blood": "#880000",
    "bone marrow": "#AACCAA",
    "brain": "#AA8888",
    "breast": "#33AA00",
    "colon": "#AAAA55",
    "embryonic structure": "#AAAAFF",
    "ESC": "#77FF44",
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
    "uterus": "#990033"
}

class ComputeGeneExpression:
    def __init__(self, es, ps, cache):
        self.es = es
        self.ps = ps
        self.cache = cache

    def _filterNAs(self, rows):
        ret = []
        for row in rows:
            r = [row[0], row[1], row[2]]
            if '{}' == r[1]:
                r[1] = "na"
            ret.append(r)
        return ret

    def regroup(self, arr):
        ret = {}
        for e in arr:
            t = e["tissue"]
	    if "" == t:
                continue
	    if t not in ret:
                c = "#000000"
                if t in TissueColors:
                    c = TissueColors[t]
	        ret[t] = {"name" : t, "color": c, "items": []}
            ret[t]["items"].append(e)
        return ret
    
    def computeHorBars(self, gene):
        with getcursor(self.ps.DBCONN, "_gene") as curs:
            curs.execute("""
            select r.tpm, r_rnas.organ, r_rnas.cellType
            from r_expression as r
            inner join r_rnas on r_rnas.encode_id = r.dataset
            where gene_name = %(gene)s""",
                         { "gene" : gene })
            rows = curs.fetchall()

        rows = self._filterNAs(rows)
        sorter = lambda x: x[1]
        rows.sort(key = sorter)

        ret = []
        for organ, subRows in groupby(rows, sorter):
            for row in subRows:
                ret.append({"cell_type" : row[2],
                            "rank" : np.log10(float(row[0]) + 0.01),
                            "tissue" : organ})

        ret = self.regroup(ret)               
        return {"items" : ret }
    

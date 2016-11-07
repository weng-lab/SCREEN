import sys, os, json

from itertools import groupby
from scipy.stats.mstats import mquantiles
import numpy as np

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor

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

    def _process(self, gene, rows):
        rows = self._filterNAs(rows)
        sorter = lambda x: x[1]
        rows.sort(key = sorter)

        boxPlots = []
        for organ, tpms in groupby(rows, sorter):
            tpms = [float(x[0]) for x in list(tpms)]
            a = np.array(tpms)
            a = np.log10(a + 0.01)
            qs = np.around(mquantiles(a), 2)
            a = np.around(a, 2)
            boxPlots.append({
                "organ" : organ,
                "Q1" : qs[0],
                "Q2" : qs[1],
                "Q3" : qs[2],
                "whisker_low": np.amin(a),
                "whisker_high" : np.amax(a)})
        return boxPlots

    def _processGene(self, gene, curs):
        curs.execute("""
select r.tpm, r_rnas.organ
from r_expression as r
inner join r_rnas on r_rnas.encode_id = r.dataset
where gene_name = %(gene)s""",
                     { "gene" : gene })
        rows = curs.fetchall()
        return self._process(gene, rows)

    def compute(self, gene):
        with getcursor(self.ps.DBCONN, "_gene") as curs:
            boxPlots = self._processGene(gene, curs)

        data = []
        mmax = 0
        for r in boxPlots:
            d = {}
            d["label"] = r["organ"]
            d["values"] = r
            d["values"]["outliers"] = []
            data.append(d)
            mmax = max(mmax, r["whisker_high"])

        ret = {"data" : data,
               "mmax" : mmax}
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
        return {"items" : ret }
    
    

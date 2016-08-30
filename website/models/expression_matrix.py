import os, sys, json
import math

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../common/python"))
from heatmap import Heatmap

class ExpressionMatrix:
    def __init__(self, es):
        self.index = "expression_matrix"
        self.es = es

    @staticmethod
    def process_for_javascript(raw_results):
        retval = {"type": "expression_matrix",
                  "matrix": raw_results.matrix,
                  "collabels": raw_results.collabels,
                  "rowlabels": raw_results.rowlabels }
        print(retval)
        return retval

    @staticmethod
    def results_to_heatmap(raw_results):
        clmap = {}
        rmtrx = []
        heatmap = {"matrix": [], "cols": [], "rows": []}
        clptr = 0
        for hit in [x["_source"] for x in raw_results]:
            rmtrx.append({})
            for ev in hit["expression_values"]:
                if ev["cell_line"] not in clmap:
                    clmap[ev["cell_line"]] = clptr
                    heatmap["cols"].append(ev["cell_line"])
                    clptr += 1
                rmtrx[len(rmtrx) - 1][ev["cell_line"]] = math.log(ev["rep1_fpkm"] + 1.0) if "rep1_fpkm" in ev else -1.0
            heatmap["rows"].append(hit["gene_name"] if hit["gene_name"] is not None else hit["ensembl_id"])
        for i in range(0, len(rmtrx)):
            heatmap["matrix"].append([-1.0 for n in range(0, clptr)])
            for k, v in rmtrx[i].iteritems():
                heatmap["matrix"][i][clmap[k]] = v
        return Heatmap(heatmap["matrix"], heatmap["rows"], heatmap["cols"])

    def search(self, ids):
        q = {"query": {"bool": {"should": [] }}}
        for i in ids:
	    q["query"]["bool"]["should"].append({"match": {"ensembl_id": i}})
        return self.rawquery(q)
    
    def rawquery(self, q):
        if type(q) is not dict: q = json.loads(q)
        raw_results = self.es.search(index = self.index, body = q)
        raw_results = ExpressionMatrix.results_to_heatmap(raw_results["hits"]["hits"])
        raw_results.cluster_rows_by_hierarchy()
        raw_results.cluster_cols_by_hierarchy()
        return ExpressionMatrix.process_for_javascript(raw_results)

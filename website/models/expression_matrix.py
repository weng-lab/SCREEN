import os, sys, json
import math
import time

#sys.path.append(os.path.join(os.path.dirname(__file__), "../../../common/python"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../heatmaps/API"))
from heatmaps.heatmap import Heatmap

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
        return retval

    @staticmethod
    def results_to_heatmap(raw_results):
        cmap = {}
        rmtrx = []
        heatmap = {"matrix": [], "cols": [], "rows": []}
        clptr = 0
        for hit in [x["_source"] for x in raw_results]:
            heatmap["matrix"].append([-1.0 for x in range(0, len(cmap))])
            heatmap["rows"].append(hit["gene_name"] if hit["gene_name"] is not None else hit["ensembl_id"])
            for ev in hit["expression_values"]:
                if ev["cell_line"] not in heatmap["cols"]:
                    heatmap["cols"].append(ev["cell_line"])
                    cmap[ev["cell_line"]] = clptr
                    clptr += 1
                    heatmap["matrix"][len(heatmap["matrix"]) - 1].append(math.log(ev["rep1_fpkm"] + 0.01) if "rep1_fpkm" in ev else -1.0)
                else:
                    heatmap["matrix"][len(heatmap["matrix"]) - 1][cmap[ev["cell_line"]]] = math.log(ev["rep1_fpkm"] + 0.01) if "rep1_fpkm" in ev else -1.0
        _heatmap = Heatmap(heatmap["matrix"])
        start = time.time()
        roworder, colorder = _heatmap.cluster_by_both()
        print("performed hierarchial clustering in %f seconds" % (time.time() - start))
        heatmap["rowlabels"] = [heatmap["rows"][x] for x in roworder]
        heatmap["collabels"] = [heatmap["cols"][x] for x in colorder]
        return heatmap

    def search(self, ids):
        q = {"query": {"bool": {"should": [] }},
             "size": 50 }
        for i in ids:
	    q["query"]["bool"]["should"].append({"match": {"ensembl_id": i}})
	    q["query"]["bool"]["should"].append({"match": {"gene_name": i}})            
        return self.rawquery(q)

    def rawquery(self, q):
        if type(q) is not dict:
            q = json.loads(q)
        raw_results = self.es.search(index = self.index, body = q)
        retval = ExpressionMatrix.results_to_heatmap(raw_results["hits"]["hits"])
        retval.update({"type": "expression_matrix"})
        return retval

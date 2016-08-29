import os, sys, json

sys.append(os.path.join(os.path.realpath(__file__), "../../../common/python"))
from heatmap import Heatmap

class ExpressionMatrix:
    def __init__(self, es):
        self.index = "expression_matrix"
        self.es = es

    @staticmethod
    def process_for_javascript(raw_results):
        retval = {"type": "query_results",
                  "index": "expression_matrix",
                  "matrix": raw_results[0],
                  "cell_lines": raw_results[1],
                  "gene_labels": raw_results[2] }
        return retval

    @staticmethod
    def results_to_heatmap(raw_results):
        clmap = {}
        rmtrx = []
        heatmap = {"matrix": [], "cols": [], "rows": []}
        clptr = 0
        for hit in [x["_source"] for x in raw_results["hits"]]:
            rmtrx.append({})
            for ev in hit["expression_values"]:
                if ev["cell_line"] not in clmap:
                    clmap[ev["cell_line"]] = clptr
                    heatmap["cols"].append(ev["cell_line"])
                    clptr += 1
                rmtrx[len(rmtrx) - 1][ev["cell_line"]] = ev["rep1_fpkm"]
            heatmap["rows"].append(hit["gene_name"] if hit["gene_name"] is not None else hit["ensembl_id"])
        for i in range(0, len(rmtrx)):
            heatmap["matrix"].append([float('NaN') for i in range(0, clptr)])
            for k, v in rmtrx[i].iteritems():
                heatmap["matrix"][i][clmap[k]] = v
        return Heatmap(heatmap["matrix"], heatmap["rows"], heatmap["cols"])
    
    def rawquery(self, q):
        raw_results = self.es.search(index = self.index, body = json.loads(q))
        raw_results = ExpressionMatrix.results_to_heatmap(raw_results)
        raw_results.cluster_rows_by_hierarchy()
        raw_results.cluster_cols_by_hierarchy()
        return ExpressionMatrix.process_for_javascript(raw_results)

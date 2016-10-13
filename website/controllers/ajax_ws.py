#!/usr/bin/env python

import os, sys, json

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from models.expression_matrix import ExpressionMatrix

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths
from elastic_search_wrapper import ElasticSearchWrapper
from postgres_wrapper import PostgresWrapper
from elasticsearch import Elasticsearch
from autocomplete import Autocompleter

class AjaxWebService:
    def __init__(self, es, ps):
        self.es = es
        self.ps = ps
        self.em = ExpressionMatrix(self.es)
        self.details = RegElementDetails(es, ps)
        self.ac = Autocompleter(es)
        self.regElements = RegElements(es)
        self.tf_list = self.ac.get_suggestions({"userQuery": "",
                                                "indices": "tfs" })["results"]

        self.cmap = {"regulatory_elements": RegElements,
                     "expression_matrix": ExpressionMatrix}

        self.actions = {"enumerate": self._enumerate,
                        "re_detail": self._re_detail,
                        "peak_detail" : self._peaks_detail,
                        "suggest" : self._suggest,
                        "query": self._query,
                        "search": self._search,
                        "gene_expression": self._expression_matrix,
                        "venn": self._venn }
        self._cached_results = {}

        ctFnp = os.path.join(os.path.dirname(__file__), "../../celltypes.txt")
        with open(ctFnp) as f:
            self.ctToTissue = json.load(f)
        
    def _format_ranks(self, ranks):
        return {"promoter": [{"cell_type": k,
                              "H3K4me3": None if "H3K4me3-Only" not in v else v["H3K4me3-Only"]["rank"],
                              "H3K4me3_DNase": None if "DNase+H3K4me3" not in v else v["DNase+H3K4me3"]["rank"] }
                             for k, v in ranks["promoter"].iteritems() ],
                "enhancer": [{"cell_type": k,
                              "H3K27ac": None if "H3K27ac-Only" not in v else v["H3K27ac-Only"]["rank"],
                              "H3K27ac_DNase": None if "DNase+H3K27ac" not in v else v["DNase+H3K27ac"]["rank"] }
                             for k, v in ranks["enhancer"].iteritems() ],
                "ctcf": [{"cell_type": k,
                          "ctcf": None if "CTCF-Only" not in v else v["CTCF-Only"]["rank"],
                          "ctcf_DNase": None if "DNase+CTCF" not in v else v["DNase+CTCF"]["rank"] }
                         for k, v in ranks["ctcf"].iteritems() ],
                "dnase": [{"cell_type": k,
                           "rank": v["rank"]} for k, v in ranks["dnase"].iteritems()] }
    
    def _venn(self, j):

        print("VENN")
        print(j)
        
        cell_lines = j["cell_lines"]
        rank = j["rank"]
        rank_type = j["rank_type"]
        
        def _run_venn_q(q):
            retval = self.es.search(body={"query": {"bool": {"must": q}}},
                                    index=paths.re_json_index)["hits"]["total"]
            print(retval)
            return retval
        
        left = _run_venn_q([{"range": {rank_type % cell_lines[0]: {"lte": rank}}},
                            {"range": {rank_type % cell_lines[1]: {"gte": rank}}}])
        center = _run_venn_q([{"range": {rank_type % cell_lines[0]: {"gte": rank}}},
                              {"range": {rank_type % cell_lines[1]: {"lte": rank}}}])
        right = _run_venn_q([{"range": {rank_type % cell_lines[0]: {"lte": rank}}},
                             {"range": {rank_type % cell_lines[1]: {"lte": rank}}}])
        
        return {"sets": [{"label": cell_lines[0], "size": left + center},
                         {"label": cell_lines[1], "size": right + center} ],
                "overlaps": [{"sets": [0, 1], "size": center}] }
    
    def _peak_format(self, peaks):
        retval = []
        for k, v in peaks.iteritems():
            retval.append({"name": k,
                           "n": len(v),
                           "encode_accs": v })
        return retval
        
    def _re_detail(self, j):
        output = {"type": "re_details",
                  "q": {"accession": j["accession"],
                        "position": j["coord"]},
                  "data": {k: self._peak_format(v) for k, v in j["peak_intersections"].iteritems()} }

        output["data"].update(self._format_ranks(j["ranks"]))

        expanded_coords = {"chrom": j["coord"]["chrom"],
                           "start": j["coord"]["start"] - 10000000,
                           "end": j["coord"]["end"] + 10000000}

        snp_results = self.es.get_overlapping_snps(j["coord"])
        gene_results = self.es.get_overlapping_genes(expanded_coords)
        re_results = self.es.get_overlapping_res(expanded_coords)

        output["data"]["overlapping_snps"] = self.details.format_snps_for_javascript(snp_results, j["coord"])
        output["data"]["nearby_genes"] = self.details.format_genes_for_javascript(gene_results, j["coord"])
        output["data"]["nearby_res"] = self.details.format_res_for_javascript(re_results, j["coord"], j["accession"])

        return output

    def _expression_matrix(self, j):
        return {"expression_matrix": {"matrix" : []}}
        matrix = []
        genelist = self._get_genelist(self._search(j))
        retval = self.em.search(genelist)
        for i in range(0, len(retval["matrix"])):
            for j in range(0, len(retval["matrix"][0])):
                matrix.append({"row": i + 1,
                               "col": j + 1,
                               "value": retval["matrix"][i][j]})
        retval.update({"matrix": matrix})
        return {"expression_matrix": retval}
    
    def _peaks_detail(self, j):
        output = {"type": "peak_details",
                  "q": {"accession": j["accession"],
                        "position": j["coord"]} }
        results = self.details.get_intersecting_beds(j["accession"])
        bed_accs = [x[0] for x in results["experiments"]]
        output["peak_results"] = self.details.get_bed_stats(bed_accs)
        return output

    def _suggest(self, j):
        ret = {"type": "suggestions",
               "callback": j["callback"]}
        ret.update(self.ac.get_suggestions(j))
        return ret

    def _get_tissue(self, celltype):
        if celltype in self.ctToTissue:
            return self.ctToTissue[celltype]
        return ""
    
    def _enumerate(self, j):
        r = self.es.get_field_mapping(index=j["index"],
                                      doc_type=j["doc_type"],
                                      field=j["field"])
        if "cell_line" == j["name"]:
            r["datapairs"] = sorted(r["datapairs"], key=lambda s: s[0].lower())
            r["results"] = []
            for datapair in r["datapairs"]:
                r["results"].append({"value": datapair[0],
                                    "tissue": self._get_tissue(datapair[0]) })
        r["name"] = j["name"]
        return r

    def _query(self, j):
        print(j["object"])
        ret = self.es.search(body=j["object"], index=j["index"])

        if j["callback"] in self.cmap:
            ret = self.cmap[j["callback"]].process_for_javascript(ret)

        ret["callback"] = j["callback"]
        self.ps.logQuery(j, ret, "")
        return ret

    def _search(self, j):
        results = self._query({"object": j["object"],
                               "index": paths.re_json_index,
                               "callback": "regulatory_elements" })
        results["aggs"]["tfs"] = self.tf_list
        results["aggs"]["cell_lines"] = self._enumerate({"name": "cell_line",
                                                         "index": paths.re_json_index,
                                                         "doc_type": "element",
                                                         "field": "ranks.dnase" })["results"]
        return results

    def _get_genelist(self, results):
        retval = {}
        for result in results["results"]["hits"]:
            for gene in result["_source"]["genes"]["nearest-all"] + result["_source"]["genes"]["nearest-pc"]:
                if gene["gene-name"] not in retval: retval[gene["gene-name"]] = 1
                if len(retval) >= 50: return [k for k, v in retval.iteritems()]
        return [k for k, v in retval.iteritems()]
    
    def process(self, j):
        try:
            if "action" in j:
                action = j["action"]
                if action in self.actions:
                    retval = self.actions[action](j)
                    #print(retval)
                    return retval
                print("unknown action:", action)

            return self.regElements.overlap(j["chrom"], int(j["start"]), int(j["end"]))

        except:
            raise
            return { "error" : "error running action"}

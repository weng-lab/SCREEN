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

        self.cmap = {"regulatory_elements": RegElements,
                     "expression_matrix": ExpressionMatrix}

        self.actions = {"enumerate": self._enumerate,
                        "re_detail": self._re_detail,
                        "peak_detail" : self._peaks_detail,
                        "suggest" : self._suggest,
                        "query": self._query,
                        "search": self._search,
                        "gene_expression": self._expression_matrix}

    def _re_detail(self, j):
        output = {"type": "re_details",
                  "q": {"accession": j["accession"],
                        "position": j["coord"]} }

        expanded_coords = {"chrom": j["coord"]["chrom"],
                           "start": j["coord"]["start"] - 10000000,
                           "end": j["coord"]["end"] + 10000000}

        snp_results = self.es.get_overlapping_snps(j["coord"])
        gene_results = self.es.get_overlapping_genes(expanded_coords)
        re_results = self.es.get_overlapping_res(expanded_coords)

        output["data"] = {}
        output["data"]["overlapping_snps"] = self.details.format_snps_for_javascript(snp_results, j["coord"])
        output["data"]["nearby_genes"] = self.details.format_genes_for_javascript(gene_results, j["coord"])
        output["data"]["nearby_res"] = self.details.format_res_for_javascript(re_results, j["coord"], j["accession"])

        return output

    def _expression_matrix(self, j):
        retval = self.em.search(j["ids"])
        matrix = []
        for i in range(0, len(retval["matrix"])):
            for j in range(0, len(retval["matrix"][0])):
                matrix.append({"row": i + 1,
                               "col": j + 1,
                               "value": retval["matrix"][i][j]})
        retval.update({"matrix": matrix})
        return retval        
    
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
        print(j["object"])
        results = self._query({"object": j["object"],
                               "index": paths.re_json_index,
                               "callback": "regulatory_elements" })
        results["aggs"]["cell_lines"] = self._enumerate({"name": "cell_line",
                                                         "index": paths.re_json_index,
                                                         "doc_type": "element",
                                                         "field": "ranks.dnase" })["results"]
        results["expression_matrix"] = self._expression_matrix({"ids": self._get_genelist(results)})
        return results

    def _get_genelist(self, results):
        retval = []
        for result in results["results"]["hits"]:
            for gene in result["_source"]["genes"]["nearest-all"] + result["_source"]["genes"]["nearest-pc"]:
                if gene["gene-name"] not in retval: retval.append(gene["gene-name"])
        return retval
    
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

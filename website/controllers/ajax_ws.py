#!/usr/bin/env python

import os, sys, json

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from elastic_search_wrapper import ElasticSearchWrapper
from postgres_wrapper import PostgresWrapper
from elasticsearch import Elasticsearch
from autocomplete import Autocompleter
from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from models.expression_matrix import ExpressionMatrix

cmap = {"regulatory_elements": RegElements,
        "expression_matrix": ExpressionMatrix}

class AjaxWebService:
    def __init__(self, es, ps):
        self.es = es
        self.ps = ps
        self.details = RegElementDetails(es, ps)
        self.ac = Autocompleter(es)
        
    def _get_and_send_re_detail(self, j):
        global details

        output = {"type": "re_details",
                  "q": {"accession": j["accession"],
                        "position": j["coord"]} }

        expanded_coords = {"chrom": j["coord"]["chrom"],
                           "start": j["coord"]["start"] - 10000000,
                           "end": j["coord"]["end"] + 10000000}

        snp_results = self.es.get_overlapping_snps(j["coord"])
        gene_results = self.es.get_overlapping_genes(expanded_coords)
        re_results = self.es.get_overlapping_res(expanded_coords)

        output["overlapping_snps"] = self.details.format_snps_for_javascript(snp_results, j["coord"])
        output["nearby_genes"] = self.details.format_genes_for_javascript(gene_results, j["coord"])
        output["nearby_res"] = self.details.format_res_for_javascript(re_results, j["coord"], j["accession"])

        return output

    def _get_and_send_peaks_detail(self, j):
        global details
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

    def process(self, payload):
        try:
            j = json.loads(payload)
            regElements = RegElements(self.es)

            if "action" in j:
                if j["action"] == "enumerate":
                    raw_results = self.es.get_field_mapping(index=j["index"],
                                                       doc_type=j["doc_type"],
                                                       field=j["field"])
                    raw_results.update({"name": j["name"]})
                    return raw_results
                if j["action"] == "re_detail":
                    return self._get_and_send_re_detail(j)
                elif j["action"] == "peak_detail":
                    return self._get_and_send_peaks_detail(j)
                elif j["action"] == "suggest":
                    return self._suggest(j)
                elif j["action"] == "query":
                    raw_results = self.es.search(body=j["object"], index=j["index"])
                    if j["callback"] in cmap:
                        processed_results = cmap[j["callback"]].process_for_javascript(raw_results)
                    else:
                        processed_results = raw_results
                    processed_results["callback"] = j["callback"]
                    self.ps.logQuery(j, processed_results, "")
                    return processed_results

            ret = regElements.overlap(j["chrom"], int(j["start"]), int(j["end"]))

        except:
            raise
            ret = { "status" : "error",
                    "err" : 1}

        return ret

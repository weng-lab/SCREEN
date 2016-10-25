#!/usr/bin/env python

from __future__ import print_function

import os, sys, json
import time

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
from load_cell_types import LoadCellTypes

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer

class AjaxWebService:
    def __init__(self, args, es, ps, cache):
        self.args = args
        self.es = es
        self.ps = ps
        self.cache = cache
        
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
                        "gene_expression": self._expression_matrix,
                        "venn": self._venn }
        self._cached_results = {}

    def _get_rank(self, label, v):
        return 1e12 if label not in v else v[label]["rank"]

    def _tissue(self, k):
        return "" if k not in self.cache.tissueMap else self.cache.tissueMap[k]
    
    def _format_ranks(self, ranks):
        return {"dnase": [{"tissue": self._tissue(k),
                           "cell_type": k,
                           "rank": v["rank"] } for k, v in ranks["dnase"].iteritems()],
                "promoter": [{"tissue": self._tissue(k),
                              "cell_type": k,
                              "H3K4me3": self._get_rank("H3K4me3-Only", v),
                              "H3K4me3_DNase": self._get_rank("DNase+H3K4me3", v) } for k, v in ranks["promoter"].iteritems()],
                "enhancer": [{"tissue": self._tissue(k),
                              "cell_type": k,
                              "H3K27ac": self._get_rank("H3K27ac-Only", v),
                              "H3K27ac_DNase": self._get_rank("DNase+H3K27ac", v) } for k, v in ranks["enhancer"].iteritems()],
                "ctcf": [{"tissue": self._tissue(k),
                          "cell_type": k,
                          "ctcf": self._get_rank("CTCF-Only", v),
                          "ctcf_DNase": self._get_rank("DNase+CTCF", v) } for k, v in ranks["ctcf"].iteritems()] }
    
    def _venn(self, j):

        #print("VENN")
        #print(j)
        
        cell_lines = j["cell_lines"]
        rank = j["rank"]
        rank_type = j["rank_type"]
        
        def _run_venn_q(q):
            retval = self.es.search(body={"query": {"bool": {"must": q}}},
                                    index=paths.re_json_index)["hits"]["total"]
            #print(retval)
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
        ret = []
        for k, v in peaks.iteritems():
            ret.append({"name": k, "n": len(v)})
        return ret
        
    def _re_detail(self, j):
        accession = j["accession"]
        j = self.details.reFull(accession)
        pos = j["position"]
        output = {"type": "re_details",
                  "q": {"accession": accession,
                        "position": pos},
                  "data": {k: self._peak_format(v)
                           for k, v in j["peak_intersections"].iteritems()} }

        output["data"].update(self._format_ranks(j["ranks"]))

        overlapBP = 10000 #10KB
        expanded_coords = {"chrom": pos["chrom"],
                           "start": max(0, pos["start"] - overlapBP),
                           "end": pos["end"] + overlapBP}
        snp_results = self.es.get_overlapping_snps(expanded_coords, "hg19")

        overlapBP = 1000000 # 1MB
        expanded_coords = {"chrom": pos["chrom"],
                           "start": max(0, pos["start"] - overlapBP),
                           "end": pos["end"] + overlapBP}
        gene_results = self.es.get_overlapping_genes(expanded_coords)
        re_results = self.es.get_overlapping_res(expanded_coords)

        output["data"].update({
            "overlapping_snps" : self.details.formatSnpsJS(snp_results, pos),
            "nearby_genes" : self.details.formatGenesJS(gene_results, pos),
            "nearby_res" : self.details.formatResJS(re_results, pos, accession)})

        return output

    def _expression_matrix(self, j):
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
    
    def _enumerate(self, j):
        if "cell_line" == j["name"]:
            r = {"results": self.cache.cellTypesAndTissues}
        else:
            r = self.es.get_field_mapping(index=j["index"],
                                          doc_type=j["doc_type"],
                                          field=j["field"])
        r["name"] = j["name"]
        return r

    def _query(self, j):
        #print(j["object"])
        ret = self.es.search(body=j["object"], index=j["index"])

        if j["callback"] in self.cmap:
            ret = self.cmap[j["callback"]].process_for_javascript(ret)

        ret["callback"] = j["callback"]
        self.ps.logQuery(j, ret, "")
        return ret

    def _get_genelist(self, results):
        retval = {}
        for result in results["results"]["hits"]:
            for gene in result["_source"]["genes"]["nearest-all"] + result["_source"]["genes"]["nearest-pc"]:
                if gene["gene-name"] not in retval:
                    retval[gene["gene-name"]] = 1
                if len(retval) >= 50:
                    return [k for k, v in retval.iteritems()]
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

    def _search(self, j):
        return self._search_partial(j)

    def _search_partial(self, j):
        # select only fields needed for re table
        #  eliminates problem of returning >10MB of json
        fields = ["accession", "neg-log-p",
                  "position.chrom", "position.start",
                  "position.end", "genes.nearest-all",
                  "genes.nearest-pc", "in_cart"]

        # http://stackoverflow.com/a/27297611
        j["object"]["_source"] = fields
        if 0:
            j["object"]["sort"] = [{ "neg-log-p" : "desc" },
                                   "position.start",
                                   "position.end" ]
        
        with Timer('ElasticSearch time'):
            results = self._query({"object": j["object"],
                                   "index": paths.re_json_index,
                                   "callback": "regulatory_elements" })
        
        if self.args.dump:
            base = Utils.timeDateStr() + "_" + Utils.uuidStr() + "_partial"
            for prefix, data in [("request", j), ("response", results)]:
                fn = base + '_' + prefix + ".json"
                fnp = os.path.join(os.path.dirname(__file__), "../../tmp/", fn)
                Utils.ensureDir(fnp)
                with open(fnp, 'w') as f:
                    json.dump(data, f, sort_keys = True, indent = 4)
                print("wrote", fnp)
        return results

    def _search_full(self, j):
        with Timer('ElasticSearch time'):
            results = self._query({"object": j["object"],
                                   "index": paths.re_json_index,
                                   "callback": "regulatory_elements" })
        
        if self.args.dump:
            base = Utils.timeDateStr() + "_" + Utils.uuidStr()
            for prefix, data in [("request", j), ("response", results)]:
                fn = base + '_' + prefix + ".json"
                fnp = os.path.join(os.path.dirname(__file__), "../../tmp/", fn)
                Utils.ensureDir(fnp)
                with open(fnp, 'w') as f:
                    json.dump(data, f, sort_keys = True, indent = 4)
                print("wrote", fnp)
        return results


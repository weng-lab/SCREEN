#!/usr/bin/env python

from __future__ import print_function

import os, sys, json
import time

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from models.expression_matrix import ExpressionMatrix
from models.tss_bar import TSSBarGraph
from models.rank_heatmap import RankHeatmap

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths
from elastic_search_wrapper import ElasticSearchWrapper
from postgres_wrapper import PostgresWrapper
from elasticsearch import Elasticsearch
from autocomplete import Autocompleter
from load_cell_types import LoadCellTypes

sys.path.append(os.path.join(os.path.dirname(__file__), "../../heatmaps/API"))
from heatmaps.heatmap import Heatmap

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer

class AjaxWebService:
    def __init__(self, args, es, ps, cache):
        self._rank_types = { "DNase": ("dnase", ""),
                             "Enhancer": ("enhancer", ".H3K27ac-Only"),
                             "Promoter": ("promoter", ".H3K4me3-Only"),
                             "CTCF": ("ctcf", ".CTCF-Only") }

        self.args = args
        self.es = es
        self.ps = ps
        self.rh = RankHeatmap(cache.cellTypesAndTissues, self._rank_types)
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
                        "venn": self._venn_search }
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
        ret = self.em.search(genelist)
        for i in range(0, len(ret["matrix"])):
            for j in range(0, len(ret["matrix"][0])):
                matrix.append({"row": i + 1,
                               "col": j + 1,
                               "value": ret["matrix"][i][j]})
        ret.update({"matrix": matrix})
        return {"expression_matrix": ret}
    
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
        ret = {}
        for result in results["results"]["hits"]:
            for gene in result["_source"]["genes"]["nearest-all"] + result["_source"]["genes"]["nearest-pc"]:
                if gene["gene-name"] not in ret:
                    ret[gene["gene-name"]] = 1
                if len(ret) >= 50:
                    return [k for k, v in ret.iteritems()]
        return [k for k, v in ret.iteritems()]
    
    def process(self, j):
        try:
            if "action" in j:
                action = j["action"]
                if action in self.actions:
                    ret = self.actions[action](j)
                    #print(ret)
                    return ret
                print("unknown action:", action)

            return self.regElements.overlap(j["chrom"], int(j["start"]), int(j["end"]))

        except:
            raise
            return { "error" : "error running action"}

    def _combine(self, query):
        retval = {"bool": {"must": []}}
        for field in ["query", "post_filter"]:
            if field in query and "bool" in query[field]:
                for _field in query[field]["bool"]:
                    retval["bool"]["must"] += query[field]["bool"][_field]
        return retval
        
    def _get_rankfield(self, rank_type, cell_type):
        rt1, rt2 = self._rank_types[rank_type]
        return "ranks.%s.%s%s.rank" % (rt1, cell_type, rt2)
        
    def _run_venn_queries(self, j, basequery):
        
        if len(j["cell_types"]) < 2:
            return {"rank_range": [],
                    "totals": {},
                    "overlaps": {} }
        
        fields = {}
        query = { "aggs": {},
                  "query": self._combine(basequery) }

        # first pass: build rank aggs, cell type aggs
        for cell_type in j["cell_types"]:
            fields[cell_type] = self._get_rankfield(j["rank_type"], cell_type)
            query["aggs"][cell_type + "min"] = {"min": {"field": fields[cell_type]}}
            query["aggs"][cell_type + "max"] = {"max": {"field": fields[cell_type]}}
            query["aggs"][cell_type] = {"filter": {"range": {fields[cell_type]: {"lte": j["rank_threshold"]}}},
                                        "aggs": {} }

        # second pass: build comparison aggs
        for cell_type in j["cell_types"]:
            for comparison_ct in j["cell_types"]:
                if cell_type == comparison_ct: continue
                query["aggs"][cell_type]["aggs"][comparison_ct] = {"range": {"field": fields[comparison_ct],
                                                                             "ranges": [{"to": j["rank_threshold"]}]}}


        # do search
        raw_results = self.es.search(body = query, index = paths.re_json_index)["aggregations"]
        rank_range = [min([raw_results[cell_type + "min"]["value"] for cell_type in j["cell_types"]]),
                      max([raw_results[cell_type + "max"]["value"] for cell_type in j["cell_types"]]) ]
        totals = {cell_type: raw_results[cell_type]["doc_count"] for cell_type in j["cell_types"]}

        # only two cell types: format as a venn diagram
        if len(j["cell_types"]) == 2:
            return {"rank_range": rank_range, "collabels": [], "rowlabels": [], "matrix": [],
                    "totals": totals,
                    "overlaps": {ct: {cct: raw_results[ct][cct]["buckets"][0]["doc_count"]
                                      for cct in j["cell_types"] if cct != ct } for ct in j["cell_types"] } }
        
        # more than two cell types: format as a heatmap
        matrix = []
        for ct1 in j["cell_types"]:
            matrix.append([])
            for ct2 in j["cell_types"]:
                if ct1 == ct2:
                    matrix[-1].append(1)
                elif raw_results[ct1]["doc_count"] + raw_results[ct2]["doc_count"] == 0:
                    matrix[-1].append(0)
                else:
                    matrix[-1].append(raw_results[ct1][ct2]["buckets"][0]["doc_count"] / float(raw_results[ct1]["doc_count"] + raw_results[ct2]["doc_count"]))
        _heatmap = Heatmap(matrix)
        roworder, colorder = _heatmap.cluster_by_both()
        return {"rank_range": rank_range, "totals": [], "overlaps": {},
                "totals": totals,
                "rowlabels": [j["cell_types"][x] for x in roworder],
                "collabels": [j["cell_types"][x] for x in colorder],
                "matrix": matrix }

    def _venn_search(self, j):

        j["post_processing"] = {}
        results = {"results": self._search(j),
                   "sep_results": {}}

        # for drawing the venn or heatmap
        results["results"]["venn"] = self._run_venn_queries(j["venn"], j["object"])
        if j["table_cell_types"][1] is None:
            return results

        # build query for individual result sets
        ctqs = []
        for cell_type in j["table_cell_types"]:
            field = self._get_rankfield(j["venn"]["rank_type"], cell_type)
            ctqs.append(({"range": {field: {"lte": j["venn"]["rank_threshold"]}}},
                         {"range": {field: {"gte": j["venn"]["rank_threshold"]}}}))

        # get overlapping results
        j["object"]["query"]["bool"] = {"must": j["object"]["query"]["bool"]["filter"]}
        j["object"]["query"]["bool"]["must"] += [ctqs[0][0], ctqs[1][0]]
        results["sep_results"]["both cell types"] = self._search({"object": j["object"], "post_processing": {}})

        # results for each cell type individually
        j["object"]["query"]["bool"]["must"] = j["object"]["query"]["bool"]["must"][:-2] + [ctqs[0][1], ctqs[1][0]]
        results["sep_results"][j["table_cell_types"][1] + " only"] = self._search({"object": j["object"], "post_processing": {}})
        j["object"]["query"]["bool"]["must"] = j["object"]["query"]["bool"]["must"][:-2] + [ctqs[0][0], ctqs[1][1]]
        results["sep_results"][j["table_cell_types"][0] + " only"] = self._search({"object": j["object"], "post_processing": {}})

        return results
    
    def _search(self, j):
        
        # select only fields needed for re table
        #  eliminates problem of returning >10MB of json
        fields = ["accession", "neg-log-p",
                  "position.chrom", "position.start",
                  "position.end", "genes.nearest-all",
                  "genes.nearest-pc", "in_cart"]
        
        # http://stackoverflow.com/a/27297611
        j["object"]["_source"] = fields
        j["callback"] = "regulatory_elements"
        if 0: # slows down query...
            j["object"]["sort"] = [{ "neg-log-p" : "desc" },
                                   "position.start",
                                   "position.end" ]

        if "rank_heatmap" in j["post_processing"]:
            j["object"]["aggs"] = self.rh.aggs
            if "bool" not in j["object"]["query"] or "must" not in j["object"]["query"]["bool"]:
                j["object"]["query"] = {"bool": {"must": []}}
            j["object"]["query"]["bool"]["must"].append(j["object"]["post_filter"])
            j["object"].pop("post_filter", None)
            j["callback"] = ""
        
        with Timer('ElasticSearch time'):
            ret = self._query({"object": j["object"],
                               "index": paths.re_json_index,
                               "callback": j["callback"] })
        if "post_processing" in j:
            if "tss_bins" in j["post_processing"]:
                tss = TSSBarGraph(ret["aggs"][j["post_processing"]["tss_bins"]["aggkey"]])
                ret["tss_histogram"] = tss.format()
            if "rank_heatmap" in j["post_processing"]:
                ret["rank_heatmap"] = self.rh.process(ret)
            if "venn" in j["post_processing"]:
                ret["venn"] = self._run_venn_queries(j["post_processing"]["venn"], j["object"])
        
        if self.args.dump:
            self._dump(j, response)
        return ret

    def _dump(self, j, response):
        base = Utils.timeDateStr() + "_" + Utils.uuidStr() + "_partial"
        for prefix, data in [("request", j), ("response", results)]:
            fn = base + '_' + prefix + ".json"
            fnp = os.path.join(os.path.dirname(__file__), "../../tmp/", fn)
            Utils.ensureDir(fnp)
            with open(fnp, 'w') as f:
                json.dump(data, f, sort_keys = True, indent = 4)
            print("wrote", fnp)

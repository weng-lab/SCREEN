from __future__ import print_function

import os, sys, json
from collections import defaultdict

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths

class RegElementDetails:
    def __init__(self, es, ps):
        self.index = paths.re_json_index
        self.es = es
        self.ps = ps

    def reFull(self, reAccession):
        q = { "query" :{
                  "bool" : {
                      "must" : [
                          {"match" : { "accession" : reAccession } }
                      ]
                  }
            }
        }
        retval = self.es.search(index = self.index, body = q)
        if "hits" not in retval or retval["hits"]["total"] == 0:
            return { "error" : "no hits for " + reAccession}
        if retval["hits"]["total"] > 1:
            return { "error" : "too many hits (%d) for " + reAccession }
        return retval["hits"]["hits"][0]["_source"]

    def _get_overlap_message(self, overlap_fraction, overlap_bp):
        if overlap_fraction > 0.0:
            return "(overlap at least %f%)" % (overlap_fraction * 100.0)
        if overlap_bp > 1:
            return "(overlap at least %d bp)" % overlap_bp
        return "(any overlap)"
    
    def get_intersecting_beds(self, reAccession,
                              overlap_fraction = 0.0, overlap_bp = 0):
        re = self.reFull(reAccession)
        if "error" in re:
            return re
        pos = re["position"]
        if overlap_fraction > 1.0:
            overlap_fraction = 1.0
        exps = self.ps.findBedOverlapAllAssays(re["genome"],
                                               pos["chrom"],
                                               pos["start"],
                                               pos["end"],
                                               overlap_fraction = overlap_fraction,
                                               overlap_bp = overlap_bp )
        print(re["genome"],
              pos["chrom"],
              pos["start"],
              pos["end"],
              self._get_overlap_message(overlap_fraction, overlap_bp))
        print("found", len(exps), "overlapping peak exps")
        return {"experiments": exps}

    def _process_result_generic(self, _results, qcoord, name_field):
        results = []
        for result in _results["hits"]["hits"]:
            result = result["_source"]
            coord = result["position"]
            distance = min(abs(int(coord["end"]) - qcoord["end"]),
                           abs(int(coord["start"]) - qcoord["start"]))
            results.append({"name": result[name_field],
                            "distance": distance})
        return results
    
    def format_snps_for_javascript(self, snp_results, qcoord):
        return self._process_result_generic(snp_results, qcoord, "accession")

    def format_res_for_javascript(self, snp_results, qcoord, name = ""):
        results = self._process_result_generic(snp_results, qcoord, "accession")
        for result in results:
            if result["name"] == name:
                results.remove(result) # exclude RE being queried
        return results

    def format_genes_for_javascript(self, gene_results, qcoord):
        return self._process_result_generic(gene_results, qcoord, "approved_symbol")
    
    def get_bed_stats(self, bed_accs):
        r = self.es.get_bed_list(bed_accs)
        hits = r["hits"]

        foundIDs = [x["_source"]["accession"] for x in hits["hits"]]

        if hits["total"] != len(bed_accs):
            for fid in bed_accs:
                if fid not in foundIDs:
                    print("WARNING: postgres BED match %s is not indexed in ElasticSearch" % fid)

        results = {"tfs": defaultdict(lambda : defaultdict(int)),
                   "histones": defaultdict(lambda : defaultdict(int)),
                   "other": defaultdict(lambda : defaultdict(int)) }
        
        for _hit in hits["hits"]:
            hit = _hit["_source"]
            cell_line = hit["biosample_term_name"]
            label = hit["label"]
            if label.strip() == "":
                label = hit["assay_term_name"]
                results["other"][cell_line][label] += 1
            elif "transcription" in hit["target"]:
                results["tfs"][cell_line][label] += 1
            elif "histone" in hit["target"]:
                results["histones"][cell_line][label] += 1
            else:
                print("WARNING: experiment with assay %s does not seem to fit into existing categories" % hit["assay_term_name"])

        formatted_results = {"tfs": [],
                             "histones": [],
                             "other": [] }

        for key, resultslist in results.iteritems():
            for cell_line, result in resultslist.iteritems():
                formatted_results[key].append({"id": cell_line,
                                               "total": 0,
                                               "labels": []})
                for label, val in result.iteritems():
                    formatted_results[key][-1]["labels"].append({"id": label,
                                                                 "count": val})
                    formatted_results[key][-1]["total"] += val
        return formatted_results

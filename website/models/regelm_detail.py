import os, sys, json

class RegElementDetails:
    def __init__(self, es, ps):
        self.index = "regulatory_elements"
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

    def get_intersecting_beds(self, reAccession):
        re = self.reFull(reAccession)
        if "error" in re: return re
        pos = re["position"]
        return {"experiments": self.ps.findBedOverlap(re["genome"],
                                                      pos["chrom"],
                                                      pos["start"],
                                                      pos["end"] )}

    def get_bed_stats(self, bed_accs):
        r = self.es.get_bed_list(bed_accs)
        hits = r["hits"]
        results = {}
        formatted_results = {"results": []}
        if hits["total"] != len(bed_accs):
            for hit in hits["hits"]:
                if hit["accession"] not in bed_accs: print("WARNING: postgres BED match %s is not indexed in ElasticSearch" % hit["accession"])
        for hit in hits["hits"]:
            cell_line = hit["biosample_term_name"]
            label = hit["label"]
            if cell_line not in results: results[cell_line] = {}
            if label not in results[cell_line]: results[cell_line][label] = 0
            results[cell_line][label] += 1
        for cell_line in results:
            formatted_results.append({"id": cell_line,
                                      "total": 0,
                                      "labels": []})
            for label in cell_line:
                formatted_results[-1]["labels"].append({"id": label, "count": results[cell_line][label]})
                formatted_results[-1]["total"] += results[cell_line][label]
        return formatted_results

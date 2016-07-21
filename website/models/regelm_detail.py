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
        exps = self.ps.findBedOverlap(re["genome"],
                                      pos["chrom"],
                                      pos["start"],
                                      pos["end"] )
        print(re["genome"],
              pos["chrom"],
              pos["start"],
              pos["end"])
        print("found", len(exps), "overlapping peak exps")
        return {"experiments": exps}

    def format_snps_for_javascript(self, snp_results, qcoord):
        results = []
        for result in snp_results["hits"]["hits"]:
            result = result["_source"]
            coord = result["position"]
            distance = min(abs(int(coord["end"]) - qcoord["end"]), abs(int(coord["start"]) - qcoord["start"]))
            results.append({"name": result["accession"],
                            "distance": distance})
        return results
    
    def get_bed_stats(self, bed_accs):
        fileIDs = bed_accs["experiments"]
        r = self.es.get_bed_list(fileIDs)
        hits = r["hits"]

        foundIDs = [x["_source"]["accession"] for x in hits["hits"]]
        print("foundIDs", foundIDs)

        if hits["total"] != len(fileIDs):
            for fid in fileIDs:
                if fid not in foundIDs:
                    print("WARNING: postgres BED match %s is not indexed in ElasticSearch" % fid)

        print("hits:", hits)
        results = {}
        formatted_results = {"results": []}

        for _hit in hits["hits"]:
            hit = _hit["_source"]
            cell_line = hit["biosample_term_name"]
            label = hit["label"]
            if label.strip() == "": label = hit["assay_term_name"]
            if cell_line not in results: results[cell_line] = {}
            if label not in results[cell_line]:
                results[cell_line][label] = 0
            results[cell_line][label] += 1
        for cell_line, result in results.iteritems():
            formatted_results["results"].append({"id": cell_line,
                                                 "total": 0,
                                                 "labels": []})
            for label, val in result.iteritems():
                formatted_results["results"][-1]["labels"].append({"id": label,
                                                                   "count": val})
                formatted_results["results"][-1]["total"] += val
        print(formatted_results)
        return formatted_results

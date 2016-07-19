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
        retval["hit"] = retval["hits"]["hits"][0]["_source"]
        return retval

    def get_intersecting_beds(self, reAccession):
        re = self.reFull(reAccession)
        if "error" in re: return re
        hit = re["hit"]
        pos = hit["position"]
        return {"experiments": self.ps.findBedOverlap(hit["genome"],
                                                 pos["chrom"],
                                                 pos["start"],
                                                 pos["end"] )}

import os, sys, json

class RegElements:
    def __init__(self, es):
        self.index = "regulatory_elements2"
        self.es = es

    def query(self, q):
        raw_results = self.es.search(index = self.index, body = json.loads(q))
        retval = {}
        for key, agg in raw_results["aggregations"].iteritems():
            if type(agg["buckets"][0]["key"]) is int:
                retval["aggs"][key] = {"type": "histogram",
                                       "key": key
                                       "minvalue": agg["buckets"][0]["key"],
                                       "maxvalue": agg["buckets"][-1]["key"],
                                       "datapairs": [] }
            elif type(bucket["key"]) is str:
                retval["aggs"][key] = {"type": "list",
                                       "key": key,
                                       "datapairs": [] }
            for bucket in agg["buckets"]:
                retval["aggs"][key]["valuepairs"].append((bucket["key"], bucket["doc_count"]))
        retval["results"] = raw_results["hits"]
        return retval
                                       

    def overlap(self, chrom, start, end):
        q = { "sort": [ {"position.start": "asc"} ],
              "query" :{
                  "bool" : {
                      "must" : [
                          {"match" : { "position.chrom" : chrom } },
                          {"range" : { "position.start" : { "lte" : end } } },
                          {"range" : { "position.end" : { "gte" : start } } }
                      ]
                  }
              }
        }

        return self.es.search(index = self.index, body = q)

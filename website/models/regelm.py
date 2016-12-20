import os, sys, json

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths

class RegElements:
    def __init__(self, es, assembly):
        self.index = paths.reJsonIndex(assembly)
        self.es = es

    @staticmethod
    def process_for_javascript(raw_results):
        retval = {"type": "query_results",
                  "index": paths.reJsonIndex(assembly),
                  "aggs": {}}
        retval["results"] = raw_results["hits"]
        if "aggregations" not in raw_results:
            return retval
        for key, agg in raw_results["aggregations"].iteritems():
            if "buckets" not in agg or len(agg["buckets"]) == 0:
                retval["aggs"][key] = {"type": "list",
                                       "key": key,
                                       "buckets": []}
            elif type(agg["buckets"][0]["key"]) is int:
                retval["aggs"][key] = {"type": "histogram",
                                       "key": key,
                                       "minvalue": agg["buckets"][0]["key"],
                                       "maxvalue": agg["buckets"][-1]["key"],
                                       "buckets": agg["buckets"] }
                continue
            elif type(agg["buckets"][0]["key"]) is str or type(agg["buckets"][0]["key"]) is unicode:
                retval["aggs"][key] = {"type": "list",
                                       "key": key,
                                       "datapairs": {} }
            else:
                print("unrecognized type %s for %s" % (type(agg["buckets"][0]["key"]), key))
                continue
            for bucket in agg["buckets"]:
                retval["aggs"][key]["datapairs"][bucket["key"]] = bucket["doc_count"]
        return retval

    def rawquery(self, q):
        raw_results = self.es.search(index = self.index, body = json.loads(q))
        return RegElements.process_for_javascript(raw_results)

    def query(self, q):
        suggestions, query = self.es.build_from_usersearch(q)
        raw_results = self.es.search(index = self.index, body = query)
        return (suggestions, RegElements.process_for_javascript(raw_results))

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

import os, sys, json

class RegElements:
    def __init__(self, es):
        self.index = "regulatory_elements"
        self.es = es

    def query(self, q):
        return self.es.search(index = self.index, body = json.loads(q))

    def overlap(self, chrom, start, end):
        q = { "sort": [ {"position.start": "asc"} ],
              "query" :{
                  "bool" : {
                      "must" : [
                          {"match" : { "position.chrom" : chrom } },
                          {"range" : { "position.start" : { "lte" : end } } },
                          {"range" : { "position.end" : { "gte" : start } } } ]
                      }
                  }
              }

        return self.es.search(index = self.index, body = q)

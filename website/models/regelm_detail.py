import os, sys, json

class RegElementDetails:
    def __init__(self, es):
        self.index = "regulatory_elements"
        self.es = es

    def reFull(self, reAccession):
        q = { "query" :{
                  "bool" : {
                      "must" : [
                          {"match" : { "accession" : reAccession } }
                      ]
                  }
            }
        }
        return self.es.search(index = self.index, body = q)

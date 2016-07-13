import os, sys, json

class ExpressionMatrix:
    def __init__(self, es):
        self.index = "expression_matrix"
        self.es = es

    @staticmethod
    def process_for_javascript(raw_results):
        retval = {"type": "query_results",
                  "index": "expression_matrix",
                  "results": raw_results["hits"]}
        return retval

    def rawquery(self, q):
        raw_results = self.es.search(index = self.index, body = json.loads(q))
        return ExpressionMatrix.process_for_javascript(raw_results)

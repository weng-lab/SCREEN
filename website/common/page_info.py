import sys, os
import requests
import json

from elasticsearch import Elasticsearch
es = Elasticsearch()

class PageInfoMain:
    def __init__(self, DBCONN, version):
        self.DBCONN = DBCONN
        self.version = version

    def wholePage(self):
        return {"page": {"version" : self.version,
                         "title" : "Regulatory Element Visualizer"},
                "version" : self.version }

    def queryPage(self, q, url):
        pageinfo = self.wholePage()
        print(q)
        try:
            res = es.search(index="regulatory_elements", body=json.loads(q))
        except:
            res = None
        pageinfo.update({"queryresults": res})
        return pageinfo

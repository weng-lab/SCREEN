import sys, os
import requests
import json

sys.path.append("../common")
sys.path.append("../../common")
import elasticsearch

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
            queryresults = elasticsearch.query(json.loads(q), url).content
        except:
            queryresults = None
        pageinfo.update({"queryresults": queryresults})
        return pageinfo

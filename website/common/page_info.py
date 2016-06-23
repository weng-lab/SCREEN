import sys, os
import requests
import json

sys.path.append("../common")
sys.path.append("../../common")
import elasticsearch

class PageInfoMain:
    def __init__(self, DBCONN, species, version):
        self.DBCONN = DBCONN
        self.species = species
        self.version = version

    def wholePage(self):
        humanVersion = self.version.replace("mouse", "human")
        mouseVersion = self.version.replace("human", "mouse")
        return {"page": {"species" : self.species,
                         "version" : self.version,
                         "humanVersion" : humanVersion,
                         "mouseVersion" : mouseVersion,
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

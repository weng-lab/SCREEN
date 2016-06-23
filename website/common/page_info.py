import sys, os

from models.regelm import RegElements

class PageInfoMain:
    def __init__(self, es, version):
        self.es = es
        self.version = version
        self.regElements = RegElements(es)

    def wholePage(self):
        return {"page": {"version" : self.version,
                         "title" : "Regulatory Element Visualizer"},
                "version" : self.version}

    def queryPage(self, q, url):
        pageinfo = self.wholePage()
        try:
            res = self.regElements.query(q)
        except:
            res = None
            raise
        pageinfo.update({"queryresults": res})
        return pageinfo

    def overlapPage(self, chrom, start, end):
        pageinfo = self.wholePage()
        try:
            res = self.regElements.overlap(chrom, start, end)
        except:
            res = None
            raise
        pageinfo.update({"queryresults": res})
        return pageinfo

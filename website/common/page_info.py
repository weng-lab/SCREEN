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

    def testqueryPage(self):
        retval = self.wholePage()
        retval.update({"facetlist": [{"id": "cell_line", "name": "cell line", "type": "list", "visible": True},
                                     {"id": "chromosome", "name": "chromosome", "type": "list", "visible": True},
                                     {"id": "coordinates", "name": "coordinates", "type": "slider", "label_text": "coordinates", "visible": False} ],
                       "ranklist": [{"id": "dnase_rank", "name": "DNase"},
                                    {"id": "ctcf_rank", "name": "CTCF"},
                                    {"id": "promoter_rank", "name": "promoter"},
                                    {"id": "enhancer_rank", "name": "enhancer"},
                                    {"id": "conservation", "name": "conservation"}] })
        return retval
    
    def rawQueryPage(self, q, url):
        pageinfo = self.wholePage()
        try:
            res = self.regElements.rawquery(q)
        except:
            res = None
            raise
        pageinfo.update({"queryresults": res})
        return pageinfo

    def queryPage(self, q):
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

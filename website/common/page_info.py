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
        retval.update({"facetlist": [{"id": "cell_line", "name": "cell line", "type": "list"},
                                     {"id": "chromosome", "name": "chromosome", "type": "list"},
                                     {"id": "coordinates", "name": "coordinates", "type": "slider", "label_text": "coordinates"},
                                     {"id": "dnase_rank", "name": "dnase rank", "type": "slider", "label_text": "rank"},
                                     {"id": "ctcf_rank", "name": "ctcf rank", "type": "slider", "label_text": "rank"},
                                     {"id": "promoter_rank", "name": "promoter rank", "type": "slider", "label_text": "rank"},
                                     {"id": "enhancer_rank", "name": "enhancer rank", "type": "slider", "label_text": "rank"},
                                     {"id": "conservation", "name": "conservation", "type": "slider", "label_text": "score"} ] })
        return retval
    
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

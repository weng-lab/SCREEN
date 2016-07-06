import sys, os, json

from models.regelm import RegElements
from parse_search import ParseSearch

class PageInfoMain:
    def __init__(self, es, DBCONN, version):
        self.es = es
        self.DBCONN = DBCONN
        self.version = version
        self.regElements = RegElements(es)

    def wholePage(self):
        return {"page": {"version" : self.version,
                         "title" : "Regulatory Element Visualizer"},
                "version" : self.version}

    def testqueryPage(self, args, kwargs):
        retval = self.wholePage()
        print("args", args)
        print("kwargs", kwargs)
        retval.update({"parsed" : ""})
        
        if "q" in kwargs:
            p = ParseSearch(self.DBCONN, kwargs["q"])
            parsed = p.parse()
            retval.update({"parsed" : json.dumps(parsed)})
            
        retval.update({"facetlist": [{"id": "cell_line",
                                      "name": "cell types",
                                      "type": "list",
                                      "visible": True},
                                     {"id": "chromosome",
                                      "name": "chromosome",
                                      "type": "list",
                                      "visible": True},
                                     {"id": "coordinates",
                                      "name": "coordinates",
                                      "type": "slider",
                                      "label_text": "coordinates",
                                      "visible": False} ],
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
            suggestions, res = self.regElements.query(q)
        except:
            res = None
            raise
        pageinfo.update({"queryresults": res,
                         "suggestions": suggestions})
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

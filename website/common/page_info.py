import sys, os, json
import subprocess

from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from parse_search import ParseSearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from autocomplete import Autocompleter

class PageInfoMain:
    def __init__(self, es, ps, version, webSocketUrl):
        self.es = es
        self.ps = ps
        self.version = version
        self.regElements = RegElements(es)
        self.regElementDetails = RegElementDetails(es, ps)
        self.webSocketUrl = webSocketUrl

    def wholePage(self):
        return {"page": {"version" : self.version,
                         "title" : "Regulatory Element Visualizer"},
                "version" : self.version,
                "webSocketUrl" : self.webSocketUrl}

    def hexplotPage(self, args, kwargs):
        retval = self.wholePage()
        retval["page"]["title"] = "hexplot view - Regulatory Element Visualizer"
        if len(args) < 1: return retval
        if "rankA" not in kwargs or "rankB" not in kwargs: return retval
        print(subprocess.check_output("ls", shell=True))
        fnps = [os.path.join(os.path.dirname(__file__), "../static/hexplot_data/%s/%s_x_%s.png" % (args[0], kwargs["rankA"], kwargs["rankB"])),
                os.path.join(os.path.dirname(__file__), "../static/hexplot_data/%s/%s_x_%s.png" % (args[0], kwargs["rankB"], kwargs["rankA"]))]
        print(fnps)
        for path in fnps:
            if os.path.exists(path):
                retval["imgpath"] = os.path.join("/%s" % self.version, "static", path.split("static/")[1])
                retval["page"]["title"] = "%s vs %s in %s - Regulatory Element Visualizer" % (kwargs["rankA"], kwargs["rankB"], args[0])
        retval["cell_line"] = args[0]
        retval["rankA"] = kwargs["rankA"]
        retval["rankB"] = kwargs["rankB"]
        return retval

    def searchPage(self, args, kwargs):
        retval = self.wholePage()

        parsed = ""
        if "q" in kwargs:
            p = ParseSearch(kwargs["q"], self.es)
            parsed = p.parse()

        facetlist = [{"id": "assembly",
                      "name": "assembly",
                      "type": "list",
                      "visible": True},
                     {"id": "cell_line",
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
                      "visible": False} ]

        ranklist = [{"id": "dnase", "name": "DNase"},
                    {"id": "ctcf", "name": "CTCF"},
                    {"id": "promoter", "name": "promoter-like"},
                    {"id": "enhancer", "name": "enhancer-like"},
                    {"id": "conservation", "name": "conservation"}]

        tsslist = [{"id": "pc", "name": "protein coding"},
                    {"id": "all", "name": "all"}]
        
        retval.update({"parsed" : json.dumps(parsed),
                       "facetlist": facetlist,
                       "ranklist": ranklist,
                       "tsslist": tsslist,
                       "facetlist_json": json.dumps(facetlist),
                       "ranklist_json": json.dumps(ranklist),
                       "tsslist_json": json.dumps(tsslist) })

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

    def element(self, accession):
        pageinfo = self.wholePage()
        try:
            res = None
        except:
            res = None
            raise
        pageinfo.update({"queryresults": res})
        return pageinfo

    def reDetail(self, reAccession, kwargs):
        if not reAccession.startswith("EE"):
            return { "error" : "invalid accession"}

        try:
            return self.regElementDetails.reFull(reAccession)
        except:
            raise
            return { "error" : "invalid read for " + reAccession }

    def rePeaks(self, reAccession, kwargs):
        try:
            return {"experiments": self.regElementDetails.get_intersecting_beds(reAccession)}
        except:
            raise
            return {"error" : "could not lookup " + reAccession}

    def autocomplete(self, j):
        ac = Autocompleter(self.es)
        return ac.get_suggestions(j["userQuery"])

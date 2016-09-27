import sys, os, json, cherrypy
import subprocess

from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from parse_search import ParseSearch

from common.session import Sessions

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from autocomplete import Autocompleter
from constants import paths

class PageInfoMain:
    def __init__(self, es, ps):
        self.es = es
        self.ps = ps
        self.regElements = RegElements(es)
        self.regElementDetails = RegElementDetails(es, ps)

    def wholePage(self, indexPage = False):
        return {"page": {"title" : "Regulatory Element Visualizer"},
                "indexPage": indexPage,
                "reAccessions" : [],
                "re_json_index" : paths.re_json_index
        }

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
                retval["imgpath"] = '/' + os.path.join("static", path.split("static/")[1])
                retval["page"]["title"] = "%s vs %s in %s - Regulatory Element Visualizer" % (kwargs["rankA"], kwargs["rankB"], args[0])
        retval["cell_line"] = args[0]
        retval["rankA"] = kwargs["rankA"]
        retval["rankB"] = kwargs["rankB"]
        return retval

    def searchPage(self, args, kwargs, uuid):
        retval = self.wholePage()

        parsed = ""
        if "q" in kwargs:
            p = ParseSearch(kwargs["q"], self.es)
            parsed = p.parse()
            parsedStr = p.parseStr()

        facetlist = [{"id": "assembly", "name": "Assembly", "type": "list",
                      "visible": True},
                     {"id": "cell_line", "name": "Cell types", "type": "list",
                      "visible": True},
                     {"id": "chromosome", "name": "Chromosome", "type": "list",
                      "visible": True},
                     {"id": "coordinates", "name": "Coordinates",
                      "type": "slider", "label_text": "coordinates",
                      "visible": False},
                     {"id": "tfs", "name": "TF peak intersection",
                      "type": "checklist", "label_text": "tfs",
                      "indices": ["tfs"], "visible": True} ]

        ranklist = [{"id": "dnase", "name": "DNase"},
                    {"id": "ctcf", "name": "CTCF"},
                    {"id": "promoter", "name": "promoter-like"},
                    {"id": "enhancer", "name": "enhancer-like"},
                    {"id": "conservation", "name": "conservation"}]

        tsslist = [{"id": "pc", "name": "protein coding"},
                    {"id": "all", "name": "all"}]

        retval.update({"parsedUserQuery" : json.dumps(parsed),
                       "parsedUserQueryStr" : parsedStr,
                       "facetlist": facetlist,
                       "ranklist": ranklist,
                       "tsslist": tsslist,
                       "facetlist_json": json.dumps(facetlist),
                       "ranklist_json": json.dumps(ranklist),
                       "tsslist_json": json.dumps(tsslist),
                       "searchPage": True,
                       "bundle_url": "http://127.0.0.1:8090/bundle.js",
                       "SessionUid" : uuid })

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
            return {"experiments": [x[0] for x in self.regElementDetails.get_intersecting_beds(reAccession)]}
        except:
            raise
            return {"error" : "could not lookup " + reAccession}

    def autocomplete(self, userQuery):
        ac = Autocompleter(self.es)
        return ac.get_suggestions(userQuery)

    def cartPage(self, uuid):
        retval = self.wholePage()

        reAccessions = self.ps.getCart(uuid)

        if not reAccessions:
            retval.update({"error": "cart %s is empty" % uuid})
            reAccessions = []

        retval.update({"reAccessions": json.dumps(reAccessions),
                       "uuid" : uuid})
        return retval

    def setCart(self, uuid, reAccessions):
        return self.ps.addToCart(uuid, reAccessions)

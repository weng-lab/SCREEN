import sys, os, json, cherrypy
import subprocess

from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from parse_search import ParseSearch

from common.session import Sessions

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from autocomplete import Autocompleter
from constants import paths, PageTitle

class PageInfoMain:
    def __init__(self, es, ps, cacheW):
        self.es = es
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, assembly, indexPage = False):
        return {"page": {"title" : PageTitle},
                "indexPage": indexPage,
                "reAccessions" : [],
                "Assembly" : assembly,
                "re_json_index" : paths.reJsonIndex(assembly),
                "globalCellCompartments" : json.dumps([])
        }

    def hexplotPage(self, args, kwargs):
        retval = self.wholePage()
        retval["page"]["title"] = "hexplot view - Regulatory Element Visualizer"
        if len(args) < 1: return retval
        if "rankA" not in kwargs or "rankB" not in kwargs: return retval
        fnps = [os.path.join(os.path.dirname(__file__), "../static/hexplot_data/%s/%s_x_%s.png" % (args[0], kwargs["rankA"], kwargs["rankB"])),
                os.path.join(os.path.dirname(__file__), "../static/hexplot_data/%s/%s_x_%s.png" % (args[0], kwargs["rankB"], kwargs["rankA"]))]
        for path in fnps:
            if os.path.exists(path):
                retval["imgpath"] = '/' + os.path.join("static", path.split("static/")[1])
                retval["page"]["title"] = "%s vs %s in %s - Regulatory Element Visualizer" % (kwargs["rankA"], kwargs["rankB"], args[0])
        retval["cell_line"] = args[0]
        retval["rankA"] = kwargs["rankA"]
        retval["rankB"] = kwargs["rankB"]
        return retval

    def searchPage(self, args, kwargs, uuid):
        if "assembly" not in kwargs:
            raise Exception("assembly not found" + str(kwargs))
        assembly = kwargs["assembly"]
        ret = self.wholePage(assembly)

        parsed = ""
        if "q" in kwargs:
            p = ParseSearch(kwargs["q"], self.es)
            parsed = p.parse()
            parsedStr = p.parseStr()

        ret.update({"globalParsedQuery" : json.dumps(parsed),
                    "globalSessionUid" : uuid,
                    "globalTfs" : self.cacheW.getTFListJson(assembly),
                    "globalCellTypes" : self.cacheW.getCTTjson(assembly),
                    "searchPage": True,
                    "tissueMap": self.cacheW.getTissueMap(assembly) })

        return ret

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
                       "uuid" : uuid,
                       "globalTfs" : self.cacheW.getTFListJson(assembly),
                       "globalCellTypes" : self.cacheW.getCTTjson(assembly) })
        return retval

    def setCart(self, uuid, reAccessions):
        return self.ps.addToCart(uuid, reAccessions)

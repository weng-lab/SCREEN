import sys, os, json
from parse_search import ParseSearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle, chrom_lengths

class PageInfoSearch:
    def __init__(self, ps, cacheW):
        self.ps = ps
        self.cacheW = cacheW

    def wholePage(self, assembly, indexPage = False):
        bundleFnp = os.path.join(os.path.dirname(__file__),
                                 "../ui/dist/bundle.js")
        return {"page": {"title" : PageTitle(assembly)},
                "indexPage": indexPage,
                "reAccessions" : [],
                "Assembly" : assembly,
                "re_json_index" : paths.reJsonIndex(assembly),
                "bundlets" : os.path.getmtime(bundleFnp)
        }

    def haveresults(self, parsed):
        return parsed["coord_chrom"] or (parsed["accessions"] and len(parsed["accessions"])) or parsed["cellType"]

    def searchPage(self, args, kwargs, uuid):
        if "assembly" not in kwargs:
            raise Exception("assembly not found" + str(kwargs))
        assembly = kwargs["assembly"]
        ret = self.wholePage(assembly)

        parsed = ""
        if "q" in kwargs:
            p = ParseSearch(kwargs["q"], self.ps.DBCONN, assembly)
            parsed = p.parse(kwargs)
            parsedStr = p.parseStr()
            if kwargs["q"] and not self.haveresults(parsed):
                ret["failed"] = kwargs["q"]

        cache = self.cacheW[assembly]

        ret.update({"globalParsedQuery" : json.dumps(parsed),
                    "showinterpretation": parsed["interpretation"],
                    "globalSessionUid" : uuid,
                    "searchPage": True
                    })

        return ret


import sys, os, json
from parse_search import ParseSearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths, PageTitle, chrom_lengths

class PageInfoSearch:
    def __init__(self, ps, cacheW):
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
            parsed = p.parse()
            parsedStr = p.parseStr()
            if kwargs["q"] and not self.haveresults(parsed):
                ret["failed"] = kwargs["q"]

        cache = self.cacheW[assembly]

        ret.update({"globalParsedQuery" : json.dumps(parsed),
                    "globalSessionUid" : uuid,
                    "searchPage": True
                    })

        return ret


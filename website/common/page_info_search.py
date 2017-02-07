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

        cache = self.cacheW[assembly]

        ret.update({"globalParsedQuery" : json.dumps(parsed),
                    "globalSessionUid" : uuid,
                    "searchPage": True
                    })

        return ret


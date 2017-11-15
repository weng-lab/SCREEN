import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from common.pg import PGsearch
from cre_utils import checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from config import Config


class GenomeBrowserWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeWS(assembly):
            return GenomeBrowserWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.wss = {a: makeWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.wss[j["assembly"]].process(j, args, kwargs)


class GenomeBrowserWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.pgSearch = PGsearch(ps, assembly)
        self.assembly = assembly

        self.actions = {"geneTrack": self.geneTrack,
                        "trackhub": self.trackhub}

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def geneTrack(self, j, args):
        chrom = checkChrom(self.assembly, j)
        results = self.pgSearch.geneTable(j, chrom,
                                          j.get("coord_start", None),
                                          j.get("coord_end", None))
        return results

    def trackhub(self, j, args):
        return []

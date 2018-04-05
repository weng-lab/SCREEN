from __future__ import print_function

import os
import sys
import json
import time
import numpy as np
import cherrypy

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from models.minipeaks import MiniPeaks

from common.pg import PGsearch

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import getAssemblyFromCre
from config import Config

class CreDetailsWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeDWS(assembly):
            return CreDetailsWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.dwss = {a: makeDWS(a) for a in self.assemblies}

    def process(self, *args, **kwargs):
        accession = kwargs["accession"]
        assembly = getAssemblyFromCre(accession)
        if assembly not in self.assemblies:
            raise Exception("invalid assembly")
        return self.dwss[assembly].process(*args, **kwargs)


class CreDetailsWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly
        self.pgSearch = PGsearch(ps, assembly)

        self.reDetailActions = {
            "miniPeaks": self._re_detail_miniPeaks,
        }

    def process(self, accession, *args, **kwargs):
        action = kwargs["data"]
        if action not in self.reDetailActions:
            raise Exception("unknown action")
        return self.reDetailActions[action](accession, **kwargs)

    def _re_detail_miniPeaks(self, accession, **kwargs):
        nbins = Config.minipeaks_nbins
        ver = Config.minipeaks_ver
        mp = MiniPeaks(self.assembly, self.pgSearch, self.cache, nbins, ver)
        rows, accessions = mp.getMinipeaksForAssays(["dnase", "h3k27ac", "h3k4me3"],
                                                    [accession])
        return {accession: {"rows": rows,
                            "accessions": accessions}}

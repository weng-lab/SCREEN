from __future__ import print_function

import os
import sys
import json
import time
import numpy as np
import cherrypy
import uuid as Uuid

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from models.cre import CRE
from models.cre_download import CREdownload
from models.rampage import Rampage
from models.minipeaks import MiniPeaks
from models.ortholog import Ortholog

from common.pg import PGsearch

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from postgres_wrapper import PostgresWrapper
from cre_utils import checkChrom
from config import Config
from pgglobal import GlobalPG
from pgfantomcat import PGFantomCat

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer
from db_utils import getcursor


class BulkWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeDWS(assembly):
            return BulkWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.dwss = {a: makeDWS(a) for a in self.assemblies}

    def process(self, args, kwargs):
        assembly = args[0]
        if assembly not in self.assemblies:
            raise Exception("invalid assembly")
        return self.dwss[assembly].process(args[1:], kwargs)


class BulkWebService:
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly
        self.pgSearch = PGsearch(ps, assembly)
        self.pgGlobal = GlobalPG(assembly)
        self.pgFantomCat = PGFantomCat(assembly)

        self.actions = {"cres": self.cres,
                        "cts": self.cts}

    def process(self, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](args[1:])
        except:
            raise

    def cres(self, args):
        assay = args[0]
        if "h3k27ac" == assay:
            values = args[1]
            if "zscores" == values:
                return self._cres_h3k27ac_zscores()
        return {}

    def _runQuery(self, q, args=None):
        with getcursor(self.ps.DBCONN, "_runQuery") as curs:
            if args:
                curs.execute(q, args)
            else:
                curs.execute(q)
            return curs.fetchall()

    def _wrapQuery2(self, q, args=None):
        q = "SELECT array_to_json(array_agg(row_to_json(r))) FROM ({q}) r".format(q=q)
        return self._runQuery(q, args)

    def _cres_h3k27ac_zscores(self):
        uuid = str(Uuid.uuid4())
        outFn, outFnp = self._downloadFileName(uuid, ".json")
        self.pgSearch.cres_h3k27ac_zscores(outFnp)
        url = os.path.join('/', "assets", "downloads", uuid, outFn)

        lookup = self.cache.rankMethodToIDxToCellTypeZeroBased["H3K27ac"]
         
        return {"indexToCellType": lookup,
                "cREsUrl": url}

    def cts(self, args):
        return self.cache.rankMethodToIDxToCellTypeZeroBased

    def _downloadFileName(self, uuid, formt):
        timestr = time.strftime("%Y%m%d-%H%M%S")
        outFn = '-'.join([timestr, "v4"]) + formt
        outFnp = os.path.join(self.staticDir, "downloads", uuid, outFn)
        Utils.ensureDir(outFnp)
        return outFn, outFnp

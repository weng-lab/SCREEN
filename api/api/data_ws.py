from __future__ import print_function

import os
import sys
import json
import time
import numpy as np
import cherrypy

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from models.cre import CRE
from models.cre_download import CREdownload
from models.rampage import Rampage
from models.minipeaks import MiniPeaks
from models.ortholog import Ortholog

from common.pg import PGsearch
from common.session import Sessions

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


class DataWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeDWS(assembly):
            return DataWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.dwss = {a: makeDWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.dwss[j["assembly"]].process(j, args, kwargs)


class DataWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly
        self.pgSearch = PGsearch(ps, assembly)
        self.pgGlobal = GlobalPG(assembly)
        self.pgFantomCat = PGFantomCat(assembly)

        self.actions = {"cre_table": self.cre_table,
                        "bed_download": self.bed_download,
                        "json_download": self.json_download,
                        "global_object": self.global_object,
                        "global_fantomcat": self.global_fantomcat,
                        "global_liftover": self.global_liftover,
                        "rampage": self.rampage
                        }

        self.session = Sessions(ps.DBCONN)

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def global_liftover(self, j, args):
        retval = {"saturation": {self.assembly: self.global_object({"name": "saturation"}, args),
                                 "hg38": self.external_global_object({"name": "saturation"}, args, "hg38"),
                                 "hg38_encode_cistrome": self.external_global_object({"name": "saturation_encode_cistrome"}, args, "hg38")},
                  "cistrome_encode": {}}
        for a in ["hg19", "hg38"]:
            for b in ["hg19", "hg38"]:
                retval["%s_%s" % (a, b)] = self.global_object({"name": "liftOver_%s_%s" % (a, b)}, args)
            retval["cistrome_encode_%s" % a] = self.global_object({"name": "encode_cistrome_%s" % a}, args)
        return retval

    def global_fantomcat(self, j, args):
        return {
            "main": self.global_object({"name": "fantomcat"}, args),
            "fantomcat_2kb": self.global_object({"name": "fantomcat_2kb"}, args)  # ,
            #            "fantomcat_bymaxz": self.global_object({"name": "fantomcat_bymaxz"}, args)
        }

    def ctcf_distr(self, j, args):
        result = self.global_object({"name": "ctcf_density_10000"}, args)
        if j["chr"] not in result:
            raise Exception("data_ws$DataWS::ctcf_distr: chr %s not valid" % j["chr"])
        return {
            "data": {
                "results": result[j["chr"]],
                "tads": [[x[0] / 10000, x[1] / 10000] for x in self.tads.get_chrom_btn(j["biosample"], j["chr"])]
            }
        }

    def global_object(self, j, args):
        with getcursor(self.ps.DBCONN, "data_ws$DataWebService::global_object") as curs:
            return self.pgGlobal.select(j["name"], curs)

    def external_global_object(self, j, args, assembly):
        with getcursor(self.ps.DBCONN, "data_ws$DataWebService::global_object") as curs:
            return self.pgGlobal.select_external(j["name"], assembly, curs)

    def cre_table(self, j, args):
        chrom = checkChrom(self.assembly, j)
        results = self.pgSearch.creTable(j, chrom,
                                         j.get("coord_start", None),
                                         j.get("coord_end", None))
        lookup = self.cache.geneIDsToApprovedSymbol
        for r in results["cres"]:
            r["genesallpc"] = {"all": [lookup[gid] for gid in r["gene_all_id"][:3]],
                               "pc": [lookup[gid] for gid in r["gene_pc_id"][:3]],
                               "accession": r["info"]["accession"]}
        if "cellType" in j and j["cellType"]:
            results["rfacets"] = self.pgSearch.rfacets_active(j)
        else:
            results["rfacets"] = ["dnase", "promoter", "enhancer", "ctcf"]
        results["cts"] = self.pgSearch.haveSCT(j)
        return results

    def rampage(self, j, args):
        rampage = Rampage(self.assembly, self.pgSearch, self.cache)
        gene = j["gene"]
        ret = rampage.getByGeneApprovedSymbol(gene)
        return {gene: ret}

    def bed_download(self, j, args):
        cd = CREdownload(self.pgSearch, self.staticDir)
        return cd.bed(j, self.session.userUid())

    def json_download(self, j, args):
        cd = CREdownload(self.pgSearch, self.staticDir)
        return cd.json(j, self.session.userUid())

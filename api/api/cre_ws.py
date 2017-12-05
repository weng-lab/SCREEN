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

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from postgres_wrapper import PostgresWrapper
from cre_utils import checkChrom, getAssemblyFromCre
from config import Config
from pgglobal import GlobalPG
from pgfantomcat import PGFantomCat

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer
from db_utils import getcursor


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
            "info": self._re_detail_info,
            "topTissues": self._re_detail_topTissues,
            "nearbyGenomic": self._re_detail_nearbyGenomic,
            "fantom_cat": self.fantom_cat,
            "ortholog": self._ortholog,
            "tfIntersection": self._re_detail_tfIntersection,
            "cistromeIntersection": self._re_detail_cistromeIntersection,
            "rampage": self._re_detail_rampage,
            "linkedGenes": self._re_detail_linkedGenes,
            "cre_tf_dcc": self.cre_tf_dcc,
            "cre_histone_dcc": self.cre_histone_dcc,
            "miniPeaks": self._re_detail_miniPeaks,
        }

    def process(self, accession, *args, **kwargs):
        action = kwargs["data"]
        if action not in self.reDetailActions:
            raise Exception("unknown action")
        return self.reDetailActions[action](accession)

    def _re_detail_topTissues(self, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        ranks = cre.topTissues()
        return {accession: ranks}

    def fantom_cat(self, accession):
        def process(key):
            with getcursor(self.ps.DBCONN, "data_ws$DataWebService::fantom_cat") as curs:
                results = self.pgFantomCat.select_cre_intersections(accession, curs, key)
            for result in results:
                result["other_names"] = result["genename"] if result["genename"] != result["geneid"] else ""
                if result["aliases"] != "":
                    if result["other_names"] != "":
                        result["other_names"] += ", "
                    result["other_names"] += ", ".join(result["aliases"].split("|"))
            return results
        return {accession: {
            "fantom_cat": process("intersections"),
            "fantom_cat_twokb": process("twokb_intersections")
        }}

    def _re_detail_nearbyGenomic(self, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        coord = cre.coord()

        # with Timer("snps") as t:
        snps = cre.intersectingSnps(10000)  # 10 KB
        # with Timer("nearbyCREs") as t:
        nearbyCREs = cre.distToNearbyCREs(1000000)  # 1 MB
        # with Timer("nearbyGenes") as t:
        nearbyGenes = cre.nearbyGenes()
        # with Timer("genesInTad") as t:
        genesInTad = cre.genesInTad()
        # with Timer("re_cres") as t:
        re_tads = cre.cresInTad()

        return {accession: {"nearby_genes": nearbyGenes,
                            "tads": genesInTad,
                            "re_tads": re_tads,
                            "nearby_res": nearbyCREs,
                            "overlapping_snps": snps}}

    def _re_detail_tfIntersection(self, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        peakIntersectCount = cre.peakIntersectCount()
        return {accession: peakIntersectCount}

    def _re_detail_cistromeIntersection(self, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        peakIntersectCount = cre.peakIntersectCount(eset="cistrome")
        return {accession: peakIntersectCount}

    def _re_detail_linkedGenes(self, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        return {accession: {"linked_genes": cre.linkedGenes()}}

    def _re_detail_rampage(self, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        nearbyGenes = cre.nearbyPcGenes()
        nearest = min(nearbyGenes, key=lambda x: x["distance"])
        rampage = Rampage(self.assembly, self.pgSearch, self.cache)
        ret = rampage.getByGene(nearest)
        return {accession: ret}

    def _re_detail_miniPeaks(self, accession):
        nbins = Config.minipeaks_nbins
        ver = Config.minipeaks_ver
        mp = MiniPeaks(self.assembly, self.pgSearch, self.cache, nbins, ver)
        rows, accessions = mp.getMinipeaksForAssays(["dnase", "h3k27ac", "h3k4me3"],
                                                    [accession])
        return {accession: {"rows": rows,
                            "accessions": accessions}}

    def _ortholog(self, accession):
        orth = Ortholog(self.assembly, self.ps.DBCONN, accession)
        return {accession: {"ortholog": orth.as_dict()}}

    def _re_detail_info(self, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        coord = cre.coord()
        ret = self.pgSearch.cre(accession, coord.chrom, coord.start, coord.end)

        lookup = self.cache.geneIDsToApprovedSymbol
        for r in ret["cres"]:
            r["genesallpc"] = {"all": [lookup[gid] for gid in r["gene_all_id"][:3]],
                               "pc": [lookup[gid] for gid in r["gene_pc_id"][:3]],
                               "accession": r["info"]["accession"]}
        if ret["total"] > 0:
            ret = ret["cres"][0]
            del ret["gene_all_id"]
            del ret["gene_pc_id"]
            ret["assembly"] = self.assembly
            return {accession: ret}
        return {accession: {}}

    def cre_tf_dcc(self, j, args):
        accession = j.get("accession", None)
        if not accession:
            raise Exception("invalid accession")
        target = j.get("target", None)
        if not target:
            raise Exception("invalid target")
        return {target: self.pgSearch.tfTargetExps(accession, target, eset=j.get("eset", None))}

    def cre_histone_dcc(self, j, args):
        accession = j.get("accession", None)
        if not accession:
            raise Exception("invalid accession")
        target = j.get("target", None)
        if not target:
            raise Exception("invalid target")
        return {target: self.pgSearch.histoneTargetExps(accession, target, eset=j.get("eset", None))}

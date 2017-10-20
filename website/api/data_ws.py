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
from models.tss_bar import TSSBarGraph
from models.rank_heatmap import RankHeatmap
from models.cytoband import Cytoband
#from models.trees import Trees
from models.tfenrichment import TFEnrichment
from models.ortholog import Ortholog
from models.tads import Tads

from common.pg import PGsearch
from common.get_set_mc import GetOrSetMemCache
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


class DataWebService(GetOrSetMemCache):
    def __init__(self, args, ps, cache, staticDir, assembly):
        GetOrSetMemCache.__init__(self, assembly, "DataWebService")

        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly
        self.pgSearch = PGsearch(ps, assembly)
        self.pgGlobal = GlobalPG(assembly)
        self.tfEnrichment = TFEnrichment(ps, assembly, cache)
        self.pgFantomCat = PGFantomCat(assembly)
        self.tads = Tads(assembly, ps)

        self.actions = {"cre_table": self.cre_table,
                        "cre_tf_dcc": self.cre_tf_dcc,
                        "cre_histone_dcc": self.cre_histone_dcc,
                        "re_detail": self.re_detail,
                        "bed_download": self.bed_download,
                        "json_download": self.json_download,
                        "trees": self.trees,
                        "tfenrichment": self.tfenrichment,
                        "global_object": self.global_object,
                        "global_fantomcat": self.global_fantomcat,
                        "ctcfdistr": self.ctcf_distr,
                        "global_liftover": self.global_liftover,
                        "rampage": self.rampage
                        }

        self.reDetailActions = {
            "topTissues": self._re_detail_topTissues,
            "targetGene": self._re_detail_targetGene,
            "nearbyGenomic": self._re_detail_nearbyGenomic,
            "tfIntersection": self._re_detail_tfIntersection,
            "cistromeIntersection": self._re_detail_cistromeIntersection,
            "linkedGenes": self._re_detail_linkedGenes,
            "rampage": self._re_detail_rampage,
            "similarREs": self._re_detail_similarREs,
            "fantom_cat": self.fantom_cat,
            "ortholog": self._ortholog}

        self.session = Sessions(ps.DBCONN)

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def _ortholog(self, j, accession):
        orth = Ortholog(self.assembly, self.ps.DBCONN, accession)
        return {accession: {"ortholog": orth.as_dict()}}

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

    def re_detail(self, j, args):
        action = args[0]
        if action not in self.reDetailActions:
            raise Exception("unknown action")
        return self.reDetailActions[action](j, j["accession"])

    def tfenrichment(self, j, args):
        a = j["tree_nodes_compare"]
        tree_rank_method = j["tree_rank_method"]
        return self.tfEnrichment.findenrichment(tree_rank_method, a[0], a[1])

    def _re_detail_topTissues(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        ranks = cre.topTissues()
        return {accession: ranks}

    def fantom_cat(self, j, accession):
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

    def _re_detail_targetGene(self, j, accession):
        return {accession: {}}

    def _re_detail_nearbyGenomic(self, j, accession):
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

    def _re_detail_tfIntersection(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        peakIntersectCount = cre.peakIntersectCount()
        return {accession: peakIntersectCount}

    def _re_detail_cistromeIntersection(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        peakIntersectCount = cre.peakIntersectCount(eset="cistrome")
        return {accession: peakIntersectCount}

    def _re_detail_linkedGenes(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        return {accession: {"linked_genes": cre.linkedGenes()}}

    def _re_detail_rampage(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        nearbyGenes = cre.nearbyPcGenes()
        nearest = min(nearbyGenes, key=lambda x: x["distance"])
        rampage = Rampage(self.assembly, self.pgSearch, self.cache)
        ret = rampage.getByGene(nearest)
        return {accession: ret}

    def rampage(self, j, args):
        rampage = Rampage(self.assembly, self.pgSearch, self.cache)
        gene = j["gene"]
        ret = rampage.getByGeneApprovedSymbol(gene)
        return {gene: ret}

    def _re_detail_similarREs(self, j, accession):
        nbins = Config.minipeaks_nbins
        ver = Config.minipeaks_ver
        mp = MiniPeaks(self.assembly, self.pgSearch, self.cache, nbins, ver)
        rows, accessions = mp.getMinipeaksForAssays(["dnase", "h3k27ac", "h3k4me3"],
                                                    [accession])
        return {accession: {"rows": rows,
                            "accessions": accessions}}

    def trees(self, j, args):
        tree_rank_method = j["tree_rank_method"]
        t = Trees(self.cache, self.ps, self.assembly, tree_rank_method)
        ret = t.getTree()
        return {tree_rank_method: ret}

    def bed_download(self, j, args):
        cd = CREdownload(self.pgSearch, self.staticDir)
        return cd.bed(j, self.session.userUid())

    def json_download(self, j, args):
        cd = CREdownload(self.pgSearch, self.staticDir)
        return cd.json(j, self.session.userUid())

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


# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng



import os
import sys
import json
import time
import numpy as np
import cherrypy
import uuid
import requests

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from models.cre import CRE
from models.cre_download import CREdownload
from models.rampage import Rampage
from models.minipeaks import MiniPeaks
from models.ortholog import Ortholog

from common.pg_search import PGsearch

sys.path.append(os.path.join(os.path.dirname(__file__), "../../utils"))
from utils import Utils, Timer

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import chroms
from postgres_wrapper import PostgresWrapper
from cre_utils import checkChrom
from config import Config
from pg_global import GlobalPG
from pg_fantomcat import PGFantomCat
from pg_home import PGHome

class DataWebServiceWrapper:
    def __init__(self, args, pw, cacheW, staticDir):
        def makeDWS(assembly):
            return DataWebService(args, pw, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies + ["GRCh38"]
        self.dwss = {a: makeDWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.dwss[j["assembly"]].process(j, args, kwargs)


class DataWebService():
    def __init__(self, args, pw, cache, staticDir, assembly):
        self.args = args
        self.pw = pw
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly
        self.pgSearch = PGsearch(pw, assembly)
        self.pgGlobal = GlobalPG(pw, assembly)
        self.pgFantomCat = PGFantomCat(pw, assembly)

        self.actions = {"cre_table": self.cre_table,
                        "cre_tf_dcc": self.cre_tf_dcc,
                        "cre_histone_dcc": self.cre_histone_dcc,
                        "re_detail": self.re_detail,
                        "bed_download": self.bed_download,
                        "json_download": self.json_download,
                        "global_object": self.global_object,
                        "global_fantomcat": self.global_fantomcat,
                        "global_liftover": self.global_liftover,
                        "rampage": self.rampage,
                        "gwas_json_download": self.gwas_json_download,
                        "home_inputData": self.home_inputData,
                        "ground_level_versions": self.ground_level
                        }

        self.reDetailActions = {
            "topTissues": self._re_detail_topTissues,
            "nearbyGenomic": self._re_detail_nearbyGenomic,
            "fantom_cat": self.fantom_cat,
            "ortholog": self._ortholog,
            "tfIntersection": self._re_detail_tfIntersection,
            "cistromeIntersection": self._re_detail_cistromeIntersection,
            "rampage": self._re_detail_rampage,
            "linkedGenes": self._re_detail_linkedGenes,
            "miniPeaks": self._re_detail_miniPeaks,
            "groundLevel": self._re_detail_groundlevel,
            "functionalValidation": self._re_detail_functionalValidation
        }

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def ground_level(self, j, args):
        results = self.pgSearch.versions()
        r = {}
        for result in results:
            result = { "accession": result[0], "biosample": result[1], "assay": result[2], "version": result[3] }
            if result["version"] not in r: r[result["version"]] = {}
            if result["biosample"] not in r[result["version"]]: r[result["version"]][result["biosample"]] = {}
            if result["assay"] not in r[result["version"]][result["biosample"]]: r[result["version"]][result["biosample"]][result["assay"]] = []
            r[result["version"]][result["biosample"]][result["assay"]].append(result["accession"])
        return r
        
    def _ortholog(self, j, accession):
        if j["assembly"] != "mm10":
            mm10 = Ortholog(self.pw, self.assembly, accession, "mm10")
            hg19 = Ortholog(self.pw, self.assembly, accession, "hg19")
            return {accession: {"ortholog": mm10.as_dict(), "hg19": hg19.as_dict()}}
        hg38 = Ortholog(self.pw, "mm10", accession, "GRCh38").as_dict()
        hg19 = []; hg19accs = set()
        for ortholog in hg38:
            for result in Ortholog(self.pw, "GRCh38",
                                   ortholog["accession"], "hg19").as_dict():
                if result["accession"] not in hg19accs:
                    hg19accs.add(result["accession"])
                    hg19.append(result)
        return { accession: { "ortholog": hg38, "hg19": hg19 }}

    def global_liftover(self, j, args):
        retval = {"saturation": {self.assembly: self.global_object({"name": "saturation"}, args),
                                 "GRCh38": self.external_global_object({"name": "saturation"}, args, "GRCh38"),
                                 "GRCh38_encode_cistrome": self.external_global_object({"name": "saturation_encode_cistrome"}, args, "GRCh38")},
                  "cistrome_encode": {}}
        for a in ["hg19", "GRCh38"]:
            for b in ["hg19", "GRCh38"]:
                retval["%s_%s" % (a, b)] = self.global_object({"name": "liftOver_%s_%s" % (a, b)}, args)
            retval["cistrome_encode_%s" % a] = self.global_object({"name": "encode_cistrome_%s" % a}, args)
        return retval

    def global_fantomcat(self, j, args):
        return {
            "main": self.global_object({"name": "fantomcat"}, args),
            "fantomcat_2kb": self.global_object({"name": "fantomcat_2kb"}, args)
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
        return self.pgGlobal.select(j["name"])

    def external_global_object(self, j, args, assembly):
        return self.pgGlobal.select_external(j["name"], assembly)

    def cre_table(self, j, args):
        chrom = checkChrom(self.assembly, j)
        results = self.pgSearch.creTable(j, chrom,
                                         j.get("coord_start", None),
                                         j.get("coord_end", None))
        lookup = self.cache.geneIDsToApprovedSymbol
        for r in results["cres"]:
            genesp, genesa = CRE(self.pgSearch, r["info"]["accession"], self.cache).nearbyGenesPA()
            r["genesallpc"] = {"all": genesa,
                               "pc": genesp,
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

    def _re_detail_functionalValidation(self, j, accession):
        def format_result(x):
            return {
                "cCRE": x[u'cCRE'],
                "accession": x[u'accession'],
                "chromosome": x[u'coordinates'][u'chromosome'],
                "start": x[u'coordinates'][u'start'],
                "length": x[u'coordinates'][u'end'] - x[u'coordinates'][u'start'],
                "tissues": x[u'tissues'],
                "overlap": x[u'overlap']
            }
        return { accession: { "functional_validation": [ format_result(x) for x in requests.post("https://factorbook.api.wenglab.org/graphql", json = {
            "query": """
               query q($cCRE: [String!]) {
                 vistaQuery(assembly: "grch38", cCRE: $cCRE) {
                   cCRE
                   accession
                   tissues
                   active
                   overlap
                   coordinates { chromosome, start, end }
                 }
                }
            """,
            "variables": { "assembly": self.assembly, "cCRE": accession }
        }).json()[u'data'][u'vistaQuery'] ] } }

    def fantom_cat(self, j, accession):
        def process(key):
            results = self.pgFantomCat.select_cre_intersections(accession, key)
            for result in results:
                result["other_names"] = result["genename"] if result["genename"] != result["geneid"] else ""
                if result["aliases"] != "":
                    if result["other_names"] != "":
                        result["other_names"] += ", "
                    result["other_names"] += ", ".join(result["aliases"].split("|"))
            return results
        
        enhancers = [{"chr": a, "start": int(b), "stop": int(c), "score": float(d)}
                         for a, b, c, d in self.pgFantomCat.select_enhancers(accession)]
        
        cage = [{"chr": a, "start": int(b), "stop": int(c), "strand": d,
                 "score": float(e), "tssstart": int(f), "tssstop": int(g)}
                for a, b, c, d, e, f, g in self.pgFantomCat.select_cage(accession)]
        return {accession: {
            "fantom_cat": process("intersections"),
            "fantom_cat_twokb": process("twokb_intersections"),
            "enhancers": enhancers,
            "cage": cage
        }}

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
        vista = cre.vista()

        return {accession: {"nearby_genes": nearbyGenes,
                            "tads": genesInTad,
                            "re_tads": re_tads,
                            "nearby_res": nearbyCREs,
                            "overlapping_snps": snps,
                            "vistaids": vista}}

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

    def bed_download(self, j, args):
        cd = CREdownload(self.pgSearch, Config.downloadDir)
        return cd.bed(j)

    def gwas_json_download(self, j, args):
        j["uuid"] = str(uuid.uuid4())
        cd = CREdownload(self.pgSearch, Config.downloadDir)
        return cd.gwas(j, j["uuid"])
    
    def json_download(self, j, args):
        cd = CREdownload(self.pgSearch, Config.downloadDir)
        return cd.json(j)

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

    def _re_detail_miniPeaks(self, j, accession):
        nbins = Config.minipeaks_nbins
        ver = Config.minipeaks_ver
        mp = MiniPeaks(self.assembly, self.pgSearch, self.cache, nbins, ver)
        rows, accessions = mp.getMinipeaksForAssays(["dnase", "h3k27ac", "h3k4me3"],
                                                    [accession])
        return {accession: {"rows": rows,
                            "accessions": accessions}}

    def _re_detail_groundlevel(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        coord = cre.coord()
        def _dreq(url):
            return requests.get(url % (coord.chrom, coord.start, coord.end)).json()["results"]["all"]
        return {accession: {
            k: _dreq("https://api.wenglab.org/peaksws/GRCh38/" + k + "/search/%s/%d/%d")
            for k in [ "tf", "histone", "dnase", "3dinteractions", "cdhs" ]
        }}
            

    def home_inputData(self, j, args):
        home = PGHome(self.ps)
        return home.inputData()

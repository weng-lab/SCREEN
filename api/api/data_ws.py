
# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng

from __future__ import print_function

import os
import sys
import json
import time
import numpy as np
import cherrypy
import uuid
import requests
import math

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

STARR_URLS = [
    "https://encode-public.s3.amazonaws.com/2020/04/22/0b5b6206-b2d0-4b74-80c6-009ca0d38fbc/ENCFF273BHD.bigBed",
    "https://encode-public.s3.amazonaws.com/2020/04/22/ed0cbf12-9748-4cc1-b19f-c02bf64b5722/ENCFF902UEX.bigWig"
]

FC_URLS = [
    "http://gcp.wenglab.org/factorbook-downloads/GRCh38.CRISPR-gRNA-Overlap.bigBed",
    "http://gcp.wenglab.org/factorbook-downloads/GRCh38.MPRA-Overlap.bigBed"
]

COLORS = """255,0,0
255,69,0
0,128,0
63,154,80
255,223,0
255,255,128
205,92,92
189,183,107
189,183,107
170,223,7
137,55,223
151,80,227
75,0,130
128,128,128
220,220,220
220,220,220
220,220,220
220,220,220
170,170,170""".split("\n")

STATES = """active_tss
flanking_active_tss
transcription
weak_transcription
enhancer
weak_enhancer
bivalent_tss
poised_enhancer
primed_enhancer
genic_enhancer
polycomb_repressed
polycomb_repressed_weak
heterochromatin
quiescent_gene
quiescent
quiescent2
quiescent3
quiescent4
UNKNOWN""".replace("_", " ").split("\n")

COLOR_MAP = { "rgb(%s)" % x: STATES[i] for i, x in enumerate(COLORS) }

TISSUES = """forebrain e0
forebrain e11.5
forebrain e12.5
forebrain e13.5
forebrain e14.5
forebrain e15.5
forebrain e16.5
heart e0
heart e11.5
heart e12.5
heart e13.5
heart e14.5
heart e15.5
heart e16.5
hindbrain e0
hindbrain e11.5
hindbrain e12.5
hindbrain e13.5
hindbrain e14.5
hindbrain e15.5
hindbrain e16.5
intestine e0
intestine e14.5
intestine e15.5
intestine e16.5
kidney e0
kidney e14.5
kidney e15.5
kidney e16.5
limb e11.5
limb e12.5
limb e13.5
limb e14.5
limb e15.5
liver e0
liver e11.5
liver e12.5
liver e13.5
liver e14.5
liver e15.5
liver e16.5
lung e0
lung e14.5
lung e15.5
lung e16.5
midbrain e0
midbrain e11.5
midbrain e12.5
midbrain e13.5
midbrain e14.5
midbrain e15.5
midbrain e16.5
stomach e0
stomach e14.5
stomach e15.5
stomach e16.5
embryonic facial prominence e11.5
embryonic facial prominence e12.5
embryonic facial prominence e13.5
embryonic facial prominence e14.5
embryonic facial prominence e15.5
neural tube e11.5
neural tube e12.5
neural tube e13.5
neural tube e14.5
neural tube e15.5""".split("\n")

def url(tissue):
    tissue = tissue.split()
    tissue[-1] = tissue[-1].replace("e", "")
    tissue = " ".join(tissue)
    return "http://gcp.wenglab.org/V3-chromHMM/%s_mouse-cCRE-V3_ChromHMM_state.bed.bigBed" % tissue.replace(" ", "_")

def wurl(tissue):
    tissue = tissue.split()
    tissue[-1] = tissue[-1].replace("e", "")
    tissue = " ".join(tissue)
    return "http://gcp.wenglab.org/chromHMMall/%s_mm10_18_posterior.bigBed" % tissue.replace(" ", "_")    

def states(c, s, e):
    def formatr(x, t):
        x["state"] = COLOR_MAP[x["color"]] + "_" + x["color"]
        x["tissue"] = t.replace("e0", "p0")
        return x
    def flatten(r):
        rr = []
        for x in r:
            rr += x
        return rr
    br = [{ "url": url(tissue), "chr1": c, "start": s, "end": e, "chr2": c } for tissue in TISSUES ]
    er = [{ "url": wurl(tissue), "chr1": c, "start": s - 50000, "end": e + 50000, "chr2": c } for tissue in TISSUES ]
    results = requests.post("https://ga.staging.wenglab.org/graphql", json = {
"query": """  query q($requests: [BigRequest!]!, $erequests: [BigRequest!]!) {
    bigRequests(requests: $requests) {
      data
    }
    expanded: bigRequests(requests: $erequests) {
      data
    }
  }
""", "variables": { "requests": br, "erequests": er } }).json()["data"]
    return (
        flatten([ [ formatr(x, tissue) for x in results["bigRequests"][i]["data"] ] for i, tissue in enumerate(TISSUES) ]),
        flatten([ [ formatr(x, tissue) for x in results["expanded"][i]["data"] ] for i, tissue in enumerate(TISSUES) ])
    )

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
            "functionalValidation": self._re_detail_functionalValidation,
            "chromhmm": self._chromhmm
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

    def _chromhmm(self, j, accession):
        coord = self._coord(accession)
        s = states(coord.chrom, coord.start, coord.end)
        return { accession: { "chromhmm": [ s[0], s[1] ] } }
    
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

    def dnase_accession(self, name):
        r = requests.post("https://ga.staging.wenglab.org/graphql", json = {
            "query": """query q($name: [String!], $assembly: String!) {
            ccREBiosampleQuery(name: $name, assembly: $assembly) {
    biosamples {
      dnase: experimentAccession(assay: "DNase")
      h3k4me3: experimentAccession(assay: "H3K4me3")
      h3k27ac: experimentAccession(assay: "H3K27ac")
      ctcf: experimentAccession(assay: "CTCF")
    }
  }
            }""", "variables": { "name": name, "assembly": self.assembly.lower() }
        }).json()
        return { k: r["data"]["ccREBiosampleQuery"]["biosamples"][0][k] for k in [ "dnase", "h3k4me3", "h3k27ac", "ctcf" ] }
    
    def cre_table(self, j, args):
        chrom = checkChrom(self.assembly, j)
        accession = self.dnase_accession(j["cellType"]) if "cellType" in j and j["cellType"] is not None else None
        print(accession, file = sys.stderr)
        if "accessions" in j and len(j["accessions"]) > 0: coords = self._coord(j["accessions"][0].upper())
        if chrom is None:
            chrom = coords.chrom
            j["coord_start"] = coords.start
            j["coord_end"] = coords.end
        r = requests.post("https://ga.staging.wenglab.org/graphql", json = {
            "query": """
            query q($coordinates: [GenomicRangeInput!], $assembly: String!, $chromosome: String, $start: Int, $end: Int) {
                cCREQuery(assembly: $assembly, coordinates: $coordinates) {
                    accession
                    coordinates {
                        chromosome
                        start
                        end
                    }
                    group
                    %s
                    dnasem: maxZ(assay: "DNase")
                    h3k4me3m: maxZ(assay: "H3K4me3")
                    h3k27acm: maxZ(assay: "H3K27ac")
                    ctcfm: maxZ(assay: "CTCF")
                }
                gene(chromosome: $chromosome, start: $start, end: $end, assembly: $assembly) {
                    name
                    coordinates {
                        chromosome
                        start
                        end
                    }
                }
            }
            """ % ("""                    dnase: maxZ(assay: "DNase")
                    h3k4me3: maxZ(assay: "H3K4me3")
                    h3k27ac: maxZ(assay: "H3K27ac")
                    ctcf: maxZ(assay: "CTCF")""" if accession is None else "\n".join([ "                    %s: zScores(experiments: \"%s\") { score }" % (k, v) for k, v in accession.items() if v is not None ])),
            "variables": {
                "coordinates": {
                    "chromosome": chrom,
                    "start": j["coord_start"],
                    "end": j["coord_end"]
                },
                "assembly": self.assembly,
                "chromosome": chrom,
                "start": j["coord_start"] - 5000000,
                "end": j["coord_end"] + 5000000
            }
        }).json()["data"]
        if accession is not None:
            r["cCREQuery"] = [ x for x in r["cCREQuery"] if "dnase" not in x or x["dnase"] is None or (x["dnase"][0]["score"] > j["rank_dnase_start"] and x["dnase"][0]["score"] < j["rank_dnase_end"]) ]
            r["cCREQuery"] = [ x for x in r["cCREQuery"] if "h3k4me3" not in x or x["h3k4me3"] is None or (x["h3k4me3"][0]["score"] > j["rank_promoter_start"] and x["h3k4me3"][0]["score"] < j["rank_promoter_end"]) ]
            r["cCREQuery"] = [ x for x in r["cCREQuery"] if "h3k27ac" not in x or x["h3k27ac"] is None or (x["h3k27ac"][0]["score"] > j["rank_enhancer_start"] and x["h3k27ac"][0]["score"] < j["rank_enhancer_end"]) ]
            r["cCREQuery"] = [ x for x in r["cCREQuery"] if "ctcf" not in x or x["ctcf"] is None or (x["ctcf"][0]["score"] > j["rank_ctcf_start"] and x["ctcf"][0]["score"] < j["rank_ctcf_end"]) ]
            for x in r["cCREQuery"]:
                x["dnase"] = x["dnase"][0]["score"] if "dnase" in x and x["dnase"] is not None else ""
                x["h3k4me3"] = x["h3k4me3"][0]["score"] if "h3k4me3" in x and x["h3k4me3"] is not None else ""
                x["h3k27ac"] = x["h3k27ac"][0]["score"] if "h3k27ac" in x and x["h3k27ac"] is not None else ""
                x["ctcf"] = x["ctcf"][0]["score"] if "ctcf" in x and x["ctcf"] is not None else ""
        genes = { x["name"]: x["coordinates"] for x in r["gene"] }
        def gene_distance(c, g):
            c = math.floor((c["coordinates"]["start"] + c["coordinates"]["end"]) / 2)
            return min(abs(g["start"] - c), abs(g["end"] - c))
        def closest_genes(c):
            distances = { k: gene_distance(c, v) for k, v in genes.items() }
            return sorted([ k for k, _ in distances.items() ], key = lambda k: distances[k])[:3]
        cg = { x["accession"]: closest_genes(x) for x in r["cCREQuery"] }
        def c(x):
            x["ct"] = j["cellType"]
            return x
        cm = { "dnase": "dnase_zscore", "h3k4me3": "promoter_zscore", "h3k27ac": "enhancer_zscore", "ctcf": "ctcf_zscore" }
        ccm = { "dnase": "dnase", "promoter": "h3k4me3", "enhancer": "h3k27ac", "ctcf": "ctcf" }
        return { "cres": [{
            "chrom": x["coordinates"]["chromosome"],
            "start": x["coordinates"]["start"],
            "len": x["coordinates"]["end"] - x["coordinates"]["start"],
            "pct": x["group"],
            "ctcf_zscore": x["ctcfm"],
            "dnase_zscore": x["dnase"],
            "enhancer_zscore": x["h3k27ac"],
            "promoter_zscore": x["h3k4me3"],
            "genesallpc": { "all": cg[x["accession"]], "pc": cg[x["accession"]], "accession": x["accession"] },
            "info": {
                "accession": x["accession"],
                "isproximal": x["group"] == "PLS" or x["group"] == "pELS",
                "concordant": False,
                "ctcfmax": x["ctcfm"],
                "k4me3max": x["h3k4me3m"],
                "k27acmax": x["h3k27acm"]
            },
            "vistaids": None,
            "sct": 0,
            "maxz": 0,
            "in_cart": 0,
            "ctspecifc": {} if accession is None else c({
                cm[k]: x[k] if x[k] != "" else None for k in [ "dnase", "h3k4me3", "h3k27ac", "ctcf" ]
            })
        } for x in r["cCREQuery"] ], "cts": [], "rfacets": [ x for x in [ "dnase", "promoter", "enhancer", "ctcf" ] if accession is None or (ccm[x] in accession and accession[ccm[x]] is not None) ], "total": 1 }

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
        r = requests.post("https://ga.staging.wenglab.org/graphql", json = {
            "query": """
            query q($accession: [String!], $assembly: String!) {
                ccREBiosampleQuery(assembly: $assembly) {
                  biosamples {
                    name
                    dnase: experimentAccession(assay: "DNase")
                    h3k4me3: experimentAccession(assay: "H3K4me3")
                    h3k27ac: experimentAccession(assay: "H3K27ac")
                    ctcf: experimentAccession(assay: "CTCF")
                  }
                }
                cCREQuery(assembly: $assembly, accession: $accession) {
                    accession
                    group
                    zScores {
                      score
                      experiment
                    }
                    dnase: maxZ(assay: "DNase")
                    h3k4me3: maxZ(assay: "H3K4me3")
                    h3k27ac: maxZ(assay: "H3K27ac")
                    ctcf: maxZ(assay: "CTCF")
                }
            }
            """,
            "variables": {
                "accession": accession,
                "assembly": self.assembly.lower()
            }
        }).json()["data"]
        print(r, file = sys.stderr)
        accessionMap = {}
        typemap = {}
        for x in r["ccREBiosampleQuery"]["biosamples"]:
            for a in [ "dnase", "h3k4me3", "h3k27ac", "ctcf" ]:
                accessionMap[x[a]] = ( x["name"], a )
            typemap[x["name"]] = "withdnase" if x["dnase"] is not None else "typec"
            if x["h3k4me3"] is not None and x["h3k27ac"] is not None and x["ctcf"] is not None and x["dnase"] is not None: typemap[x["name"]] = "typea"
        scores = {}; sscores = {}
        cre = CRE(self.pgSearch, accession, self.cache)
        for xx in r["cCREQuery"][0]["zScores"]:
            if xx["experiment"] not in accessionMap: continue
            ct, assay = accessionMap[xx["experiment"]]
            if ct not in scores: scores[ct] = { a: -11 for a in [ "dnase", "h3k4me3", "h3k27ac", "ctcf" ] }
            scores[ct]["group"] = r["cCREQuery"][0]["group"]
            scores[ct][assay] = xx["score"]
            scores[ct]["ct"] = ct
            scores[ct]["tissue"] = ""
        cre.group = r["cCREQuery"][0]["group"]
        for k, v in scores.items():
            v["group"] = cre._group(v, v["group"] == "PLS" or v["group"] == "pELS")
            if typemap[k] not in sscores: sscores[typemap[k]] = []
            sscores[typemap[k]].append(v)
        sscores["iranks"] = [{ k: v for k, v in r["cCREQuery"][0].items() }]
        sscores["iranks"][0]["title"] = "cell type agnostic"
        return { accession: sscores }
        ranks = cre.topTissues()
        return {accession: ranks}

    def _re_detail_functionalValidation(self, j, accession):
        coord = self._coord(accession)
        c = coord.chrom
        s = coord.start
        e = coord.end
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
        def regionaverage(values):
            total = 0
            for x in values:
                total += x["value"] * (x["end"] - x["start"])
            return float(total) / (e - s)
        jx = requests.post("https://factorbook.api.wenglab.org/graphql", json = {
            "query": """
               query q($cCRE: [String!], $requests: [BigRequest!]!) {
                 vistaQuery(assembly: "grch38", cCRE: $cCRE, active: true) {
                   cCRE
                   accession
                   tissues
                   active
                   overlap
                   coordinates { chromosome, start, end }
                 }
                 bigRequests(requests: $requests) {
                   data
                 }
               }
            """,
            "variables": { "assembly": self.assembly, "cCRE": accession, "requests": [{ "url": x, "chr1": c, "start": s, "end": e, "chr2": c } for x in STARR_URLS + FC_URLS ] }
        })
        try:
            j = jx.json()
        except:
            print(jx.text, file = sys.stderr)
            j = { "data": { "vistaQuery": [], "bigRequests": [{ "data": [] }, { "data": [] }, { "data": [] }, { "data": [] }] } }
        return { accession: { "vista": [ format_result(x) for x in j['data']['vistaQuery'] ], "starr": { "reads": regionaverage(j["data"]["bigRequests"][1]["data"]), "results": j["data"]["bigRequests"][0]["data"] }, "mpra": j["data"]["bigRequests"][3]["data"], "CRISPR": j["data"]["bigRequests"][2]["data"] } }

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

    def _coord(self, accession):
        rr = requests.post("https://ga.staging.wenglab.org/graphql", json = {
            "query": """
            query q($assembly: String!, $accession: [String!]) {
              cCREQuery(accession: $accession, assembly: $assembly) {
                coordinates {
                  chromosome
                  start
                  end
                }
              }
             }""", "variables": { "assembly": self.assembly, "accession": accession }}).json()["data"]["cCREQuery"][0]["coordinates"]
        class Coord:
            def __init__(self, rr):
                self.chrom = rr["chromosome"]
                self.start = rr["start"]
                self.end = rr["end"]
        return Coord(rr)
    
    def _re_detail_nearbyGenomic(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        coord = self._coord(accession)
        r = requests.post("https://ga.staging.wenglab.org/graphql", json = {
            "query": """
            query features($coordinates: [GenomicRangeInput!], $chromosome: String, $start: Int, $end: Int, %s $b: String!, $c: String!) {
            %s
            gene(chromosome: $chromosome, start: $start, end: $end, assembly: $b) {
            name
            id
            coordinates {
                chromosome
                start
                end
            }
        }
            cCREQuery(assembly: $c, coordinates: $coordinates) {
            accession
            coordinates {
                chromosome
                start
                end
            }
            group
        }
            }""" % ( "$a: String!," if self.assembly == "GRCh38" else "", """snpQuery(coordinates: $coordinates, assembly: $a, common: true) {
            id
            coordinates {
                chromosome
                start
                end
            }
        }""" if self.assembly == "GRCh38" else "" ), "variables": { "coordinates": { "chromosome": coord.chrom, "start": coord.start - 100000, "end": coord.end + 100000 }, "chromosome": coord.chrom, "start": coord.start - 1000000, "end": coord.end + 1000000, "a": "hg38" if self.assembly == "GRCh38" else self.assembly, "b": self.assembly, "c": self.assembly.lower() }}).json()["data"]
        def gene_distance(g):
            c = math.floor((coord.start + coord.end) / 2)
            return min(abs(g["start"] - c), abs(g["end"] - c))
        def snp_distance(s):
            c = math.floor((coord.start + coord.end) / 2)
            return abs(c - s["coordinates"]["start"])
        def ccre_distance(cc):
            c = math.floor((coord.start + coord.end) / 2)
            cc = math.floor((cc["coordinates"]["start"] + cc["coordinates"]["end"]) / 2)
            return abs(cc - c)

        return {
            accession: {
                "nearby_genes": [{ "name": x["name"], "ensemblid_ver": x["id"], "chrom": x["coordinates"]["chromosome"], "start": x["coordinates"]["start"], "stop": x["coordinates"]["end"], "distance": gene_distance(x["coordinates"])} for x in r["gene"]],
                "nearby_res": [{ "name": x["accession"], "distance": ccre_distance(x) } for x in r["cCREQuery"]],
                "overlapping_snps": [{ "accession": accession, "chrom": coord.chrom, "cre_start": coord.start, "cre_end": coord.end, "distance": snp_distance(x), "snp_start": x["coordinates"]["start"], "snp_end": x["coordinates"]["end"], "name": x["id"] } for x in (r["snpQuery"] if "snpQuery" in r else []) ],
                "re_tads": [],
                "tads": [],
                "vistaids": []
            }
        }
        
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
        coord = self._coord(accession)
        rr = requests.post("https://ga.staging.wenglab.org/graphql", json = {
            "query": """query tfpeaks($assembly: String, $range: [ChromosomeRangeInput]!, $species: String) {
            peaks(assembly: $assembly, range: $range) {
    peaks {
      chrom
      chrom_start
      chrom_end
      dataset {
        biosample
        accession
        target
      }
    }
}
peakDataset(species: $species) {
    partitionByTarget {
      target {
        name
      }
      counts {
        total
      }
    }
  }
            }""", "variables": { "assembly": j["assembly"].lower(), "range": { "chrom": coord.chrom, "chrom_start": coord.start, "chrom_end": coord.end }, "species": "Homo sapiens" if j["assembly"] == "GRCh38" else "Mus musculus" }
        }).json()
        print(rr, file = sys.stderr)
        rr = rr["data"]
        peakmap = {}
        for x in rr["peaks"]["peaks"]:
            if x["dataset"]["target"] not in peakmap: peakmap[x["dataset"]["target"]] = set()
            peakmap[x["dataset"]["target"]].add(x["dataset"]["accession"])
        totalmap = { x["target"]["name"]: x["counts"]["total"] for x in rr["peakDataset"]["partitionByTarget"] }
        return { accession: { "histone": [], "tf": [{
            "name": k, "n": len(v), "total": totalmap[k]
        } for k, v in peakmap.items() ] } }

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
        return cd.json(j, self.cache)

    def cre_tf_dcc(self, j, args):
        accession = j.get("accession", None)
        if not accession:
            raise Exception("invalid accession")
        target = j.get("target", None)
        if not target:
            raise Exception("invalid target")
        coord = self._coord(accession)
        rr = requests.post("https://ga.staging.wenglab.org/graphql", json = {
            "query": """query tfpeaks($assembly: String, $range: [ChromosomeRangeInput]!, $target: String) {
            peaks(assembly: $assembly, range: $range, target: $target) {
    peaks {
      chrom
      chrom_start
      chrom_end
      dataset {
        biosample
        accession
        target
files(types: "replicated_peaks") {
                      accession
                    }
      }
    }
            }}""", "variables": { "assembly": j["assembly"].lower(), "range": { "chrom": coord.chrom, "chrom_start": coord.start, "chrom_end": coord.end }, "target": target }}).json()["data"]["peaks"]["peaks"]
        return {target: [{ "expID": "%s / %s" % (x["dataset"]["accession"], x["dataset"]["files"][0]["accession"]), "biosample_term_name": x["dataset"]["biosample"] } for x in rr ]}

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

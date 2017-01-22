#!/usr/bin/env python

from __future__ import print_function

import os, sys, json
import time
import numpy as np

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from models.cre import CRE
from models.expression_matrix import ExpressionMatrix
from models.tss_bar import TSSBarGraph
from models.rank_heatmap import RankHeatmap
from models.correlation import Correlation
from models.cytoband import Cytoband
from models.bigwig import BigWig
from models.trees import Trees
from models.tfenrichment import TFEnrichment

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from pg import PGsearch

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from postgres_wrapper import PostgresWrapper

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer
from db_utils import getcursor

class DataWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeDWS(assembly):
            return DataWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.dwss = { "hg19" : makeDWS("hg19"),
                      "mm10" : makeDWS("mm10") }

    def process(self, j, args, kwargs):
        if "GlobalAssembly" not in j:
            raise Exception("GlobalAssembly not defined")
        if j["GlobalAssembly"] not in ["mm10", "hg19"]:
            raise Exception("invalid GlobalAssembly")
        return self.dwss[j["GlobalAssembly"]].process(j, args, kwargs)

class DataWebService:
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly
        self.pgSearch = PGsearch(ps, assembly)
        self.tfEnrichment = TFEnrichment(ps, assembly, cache)

        self.actions = {"cre_table" : self.cre_table,
                        "re_detail" : self.re_detail,
                        "trees" : self.trees,
                        "tfenrichment": self.tfenrichment }

        self.reDetailActions = {
            "topTissues" : self._re_detail_topTissues,
            "targetGene" : self._re_detail_targetGene,
            "nearbyGenomic" : self._re_detail_nearbyGenomic,
            "tfIntersection" : self._re_detail_tfIntersection,
            "relatedGene" : self._re_detail_relatedGene,
            "assocTSS" : self._re_detail_assocTSS,
            "similarREs" : self._re_detail_similarREs}

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def _checkChrom(self, j):
        chrom = j["coord_chrom"]
        if chrom and chrom not in chroms[self.assembly]:
            raise Exception("unknown chrom")
        return chrom

    def cre_table(self, j, args):
        chrom = self._checkChrom(j)
        return self.pgSearch.creTable(chrom, j["coord_start"], j["coord_end"], j)

    def re_detail(self, j, args):
        action = args[0]
        if action not in self.reDetailActions:
            raise Exception("unknown action")
        try:
            return self.reDetailActions[action](j, j["accession"])
        except:
            raise

    def tfenrichment(self, j, args):
        return self.tfEnrichment.findenrichment(j["left"], j["right"])

    def _re_detail_topTissues(self, j, accession):
        cre = CRE(self.pgSearch, accession)
        ranks = cre.topTissues(self.cache)
        return { accession : ranks }

    def _re_detail_targetGene(self, j, accession):
        return { accession : {} }

    def _re_detail_nearbyGenomic(self, j, accession):
        cre = CRE(self.pgSearch, accession)
        coord = cre.coord()
        snps = cre.intersectingSnps(10000) # 10 KB
        nearbyCREs = cre.nearbyCREs(1000000) # 1 MB
        nearbyGenes = cre.nearbyGenes()
        genesInTad = cre.genesInTad()
        return { accession : {"nearby_genes": nearbyGenes,
                              "tads": genesInTad,
                              "re_tads": [],
                              "nearby_res": nearbyCREs,
                              "overlapping_snps": snps} }

    def _re_detail_tfIntersection(self, j, accession):
        cre = CRE(self.pgSearch, accession)
        peakIntersectCount = cre.peakIntersectCount()
        return { accession : peakIntersectCount }

    def _re_detail_relatedGene(self, j, accession):
        return { accession : {} }

    def _re_detail_assocTSS(self, j, accession):
        return { accession : {} }

    def _re_detail_similarREs(self, j, accession):
        cre = CRE(self.pgSearch, accession)
        regions, mostSimilar = cre.getBigWigRegions(accession, self.cache)
        return { accession : {"regions" : regions,
                              "mostSimilar": mostSimilar}}

    def trees(self, j, args):
        print(j)
        tree_rank_method = j["tree_rank_method"]
        t = Trees(self.cache, self.ps, self.assembly, tree_rank_method)
        ret = t.getTree()
        return {tree_rank_method: ret}

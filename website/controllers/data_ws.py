
from __future__ import print_function

import os, sys, json
import time
import numpy as np

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from models.cre import CRE
from models.cre_download import CREdownload
from models.minipeaks import MiniPeaks
from models.expression_matrix import ExpressionMatrix
from models.tss_bar import TSSBarGraph
from models.rank_heatmap import RankHeatmap
from models.cytoband import Cytoband
from models.trees import Trees
from models.tfenrichment import TFEnrichment
from models.ortholog import Ortholog

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from pg import PGsearch
from compute_gene_expression import ComputeGeneExpression, Compartments

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
        self.mpk = MiniPeaks(self.pgSearch, "", self.cache)

        self.actions = {"cre_table" : self.cre_table,
                        "re_detail" : self.re_detail,
                        "bed_download" : self.bed_download,
                        "json_download" : self.json_download,
                        "trees" : self.trees,
                        "tfenrichment": self.tfenrichment }

        self.reDetailActions = {
            "topTissues" : self._re_detail_topTissues,
            "targetGene" : self._re_detail_targetGene,
            "nearbyGenomic" : self._re_detail_nearbyGenomic,
            "tfIntersection" : self._re_detail_tfIntersection,
            "relatedGene" : self._re_detail_relatedGene,
            "assocTSS" : self._re_detail_assocTSS,
            "similarREs" : self._re_detail_similarREs,
            "ortholog": self._ortholog }

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def _checkChrom(self, j):
        chrom = j.get("coord_chrom", None)
        if chrom and chrom not in chroms[self.assembly]:
            raise Exception("unknown chrom")
        return chrom

    def _ortholog(self, j, accession):
        return {accession: {"ortholog": Ortholog(self.assembly, self.ps.DBCONN, accession).as_dict()}}
    
    def cre_table(self, j, args):
        chrom = self._checkChrom(j)
        results = self.pgSearch.creTable(j, chrom,
                                         j.get("coord_start", None),
                                         j.get("coord_end", None))
        if "withpeaks" in j:
            res = results["cres"][:20]
            n_bars = 15
            r, e = self.mpk.regionsFromSearchList(j["withpeaks"], res, n_bars)
            order = r["order"]
            r.pop("order", None)
            results["peakdata"] = {"order": order, "mostSimilar": e, "regions": r}
        return results

    def re_detail(self, j, args):
        action = args[0]
        if action not in self.reDetailActions:
            raise Exception("unknown action")
        try:
            return self.reDetailActions[action](j, j["accession"])
        except:
            raise

    def tfenrichment(self, j, args):
        a = j["tree_nodes_compare"]
        tree_rank_method = j["tree_rank_method"]
        return self.tfEnrichment.findenrichment(tree_rank_method, a[0], a[1]);

    def _re_detail_topTissues(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        ranks = cre.topTissues()
        return { accession : ranks }

    def _re_detail_targetGene(self, j, accession):
        return { accession : {} }

    def _re_detail_nearbyGenomic(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        coord = cre.coord()
        snps = cre.intersectingSnps(10000) # 10 KB
        nearbyCREs = cre.distToNearbyCREs(1000000) # 1 MB
        nearbyGenes = cre.nearbyGenes()
        genesInTad = cre.genesInTad()
        return { accession : {"nearby_genes": nearbyGenes,
                              "tads": genesInTad,
                              "re_tads": [],
                              "nearby_res": nearbyCREs,
                              "overlapping_snps": snps} }

    def _re_detail_tfIntersection(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        peakIntersectCount = cre.peakIntersectCount()
        return { accession : peakIntersectCount }

    def _re_detail_relatedGene(self, j, accession):
        return { accession : {} }

    def _re_detail_assocTSS(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        nearbyGenes = cre.nearbyGenes()
        nearest = nearbyGenes[0]
        for gene in nearbyGenes[1:]:
            if gene["distance"] < nearest["distance"]:
                nearest = gene
        if nearest["distance"] > 5000:
            return { accession : {"no_nearby_tss": True} }
        cge = ComputeGeneExpression(None, self.ps, self.cache, self.assembly)
        name = self.cache._try_genename(nearest["name"])
        r = cge.computeHorBars(name, (u'cell',))
        r["genename"] = name
        return {accession: r}
    
    def _re_detail_similarREs(self, j, accession):
        assay = "dnase"
        if "extras" in j:
            if "assay" in j["extras"]:
                assay = j["extras"]["assay"] 
        mp = MiniPeaks(self.pgSearch, accession, self.cache)
        regions, mostSimilar = mp.getBigWigRegionsWithSimilar(assay)
        order = regions["order"]
        regions.pop("order", None)
        return { accession : {"regions" : regions,
                              "mostSimilar": mostSimilar,
                              "order": order}}

    def trees(self, j, args):
        tree_rank_method = j["tree_rank_method"]
        t = Trees(self.cache, self.ps, self.assembly, tree_rank_method)
        ret = t.getTree()
        return {tree_rank_method: ret}

    def bed_download(self, j, args):
        cd = CREdownload(j)
        return cd.bed()
    
    def json_download(self, j, args):
        cd = CREdownload(j)
        return cd.json()
    

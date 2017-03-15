from __future__ import print_function

import os, sys, json
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
from models.trees import Trees
from models.tfenrichment import TFEnrichment
from models.ortholog import Ortholog

from common.pg import PGsearch
from common.get_set_mc import GetOrSetMemCache
from models.gene_expression import GeneExpression
from common.session import Sessions

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from postgres_wrapper import PostgresWrapper
from cre_utils import checkChrom
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer
from db_utils import getcursor

class DataWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeDWS(assembly):
            return DataWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.dwss = {a : makeDWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "GlobalAssembly" not in j:
            raise Exception("GlobalAssembly not defined")
        if j["GlobalAssembly"] not in self.assemblies:
            raise Exception("invalid GlobalAssembly")
        return self.dwss[j["GlobalAssembly"]].process(j, args, kwargs)

class DataWebService(GetOrSetMemCache):
    def __init__(self, args, ps, cache, staticDir, assembly):
        GetOrSetMemCache.__init__(self, assembly, "DataWebService")

        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly
        self.pgSearch = PGsearch(ps, assembly)
        self.tfEnrichment = TFEnrichment(ps, assembly, cache)

        self.actions = {"cre_table" : self.cre_table,
                        "cre_tf_dcc" : self.cre_tf_dcc,
                        "cre_histone_dcc" : self.cre_histone_dcc,
                        "re_detail" : self.re_detail,
                        "bed_download" : self.bed_download,
                        "json_download" : self.json_download,
                        "trees" : self.trees,
                        "tfenrichment": self.tfenrichment
        }

        self.reDetailActions = {
            "topTissues" : self._re_detail_topTissues,
            "targetGene" : self._re_detail_targetGene,
            "nearbyGenomic" : self._re_detail_nearbyGenomic,
            "tfIntersection" : self._re_detail_tfIntersection,
            "relatedGene" : self._re_detail_relatedGene,
            "rampage" : self._re_detail_rampage,
            "ge" : self._re_detail_ge,
            "similarREs" : self._re_detail_similarREs,
            "ortholog": self._ortholog }

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

    def cre_table(self, j, args):
        chrom = checkChrom(self.assembly, j)
        results = self.pgSearch.creTable(j, chrom,
                                         j.get("coord_start", None),
                                         j.get("coord_end", None))
        lookup = self.cache.geneIDsToApprovedSymbol
        for r in results["cres"]:
            r["genesallpc"] = [[lookup[gid] for gid in r["gene_all_id"][:3]],
                               [lookup[gid] for gid in r["gene_pc_id"][:3]]]
        if "cellType" in j and j["cellType"]:
            results["rfacets"] = self.pgSearch.rfacets_active(j)
        else:
            results["rfacets"] = ["dnase", "promoter", "enhancer", "ctcf"]
        results["cts"] = self.pgSearch.haveCTS(j)
        return results

    def re_detail(self, j, args):
        action = args[0]
        if action not in self.reDetailActions:
            raise Exception("unknown action")
        return self.reDetailActions[action](j, j["accession"])

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

        #with Timer("snps") as t:
        snps = cre.intersectingSnps(10000) # 10 KB
        #with Timer("nearbyCREs") as t:
        nearbyCREs = cre.distToNearbyCREs(1000000) # 1 MB
        #with Timer("nearbyGenes") as t:
        nearbyGenes = cre.nearbyGenes()
        #with Timer("genesInTad") as t:
        genesInTad = cre.genesInTad()
        #with Timer("re_cres") as t:
        re_tads = cre.cresInTad()

        return { accession : {"nearby_genes": nearbyGenes,
                              "tads": genesInTad,
                              "re_tads": re_tads,
                              "nearby_res": nearbyCREs,
                              "overlapping_snps": snps} }

    def _re_detail_tfIntersection(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        peakIntersectCount = cre.peakIntersectCount()
        return { accession : peakIntersectCount }

    def _re_detail_relatedGene(self, j, accession):
        return { accession : {} }

    def _re_detail_ge(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        nearbyGenes = cre.nearbyPcGenes()
        nearest = min(nearbyGenes, key = lambda x: x["distance"])
        cge = GeneExpression(self.ps, self.cache, self.assembly)
        name, strand = self.cache.lookupEnsembleGene(nearest["name"])
        r = cge.computeHorBars(name, ["cell"], self.cache.geBiosampleTypes)
        r["genename"] = name
        r["ensemblid_ver"] = nearest["ensemblid_ver"]
        return {accession: r}

    def _re_detail_rampage(self, j, accession):
        cre = CRE(self.pgSearch, accession, self.cache)
        nearbyGenes = cre.nearbyPcGenes()
        nearest = min(nearbyGenes, key = lambda x: x["distance"])
        cre = CRE(self.pgSearch, accession, self.cache)
        rampage = Rampage(self.assembly, self.pgSearch)
        ret = rampage.getByGene(nearest)
        return {accession: ret}

    def _re_detail_similarREs(self, j, accession):
        nbins = Config.minipeaks_nbins
        ver = Config.minipeaks_ver
        mp = MiniPeaks(self.assembly, self.pgSearch, self.cache, nbins, ver)
        rows, accessions = mp.getMinipeaksForAssays(["dnase", "h3k27ac", "h3k4me3"],
                                                    [accession])
        return {accession : {"rows" : rows,
                             "accessions" : accessions}}

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
        return {target : self.pgSearch.tfTargetExps(accession, target)}

    def cre_histone_dcc(self, j, args):
        accession = j.get("accession", None)
        if not accession:
            raise Exception("invalid accession")
        target = j.get("target", None)
        if not target:
            raise Exception("invalid target")
        return {target : self.pgSearch.histoneTargetExps(accession, target)}


# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


import sys
import os

from models.cre import CRE
from models.gene_expression import GeneExpression
from common.pg_search import PGsearch

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from config import Config
from cre_utils import isaccession


class GeneExpWebServiceWrapper:
    def __init__(self, args, ps, cacheW, staticDir):
        def makeWS(assembly):
            return GeneExpWebService(args, ps, cacheW[assembly], staticDir, assembly)
        self.assemblies = Config.assemblies
        self.wss = {a: makeWS(a) for a in self.assemblies}

    def process(self, j, args, kwargs):
        if "assembly" not in j:
            raise Exception("assembly not defined")
        if j["assembly"] not in self.assemblies:
            raise Exception("invalid assembly")
        return self.wss[j["assembly"]].process(j, args, kwargs)


class GeneExpWebService(object):
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly
        self.pgSearch = PGsearch(ps, assembly)

        self.allBiosampleTypes = set(["cell line", "induced pluripotent stem cell line",
                                      "in vitro differentiated cells", "primary cell",
                                      "stem cell", "tissue"])

        self.actions = {"search": self.search}

    def process(self, j, args, kwargs):
        action = args[0]
        try:
            return self.actions[action](j, args[1:])
        except:
            raise

    def search(self, j, args):
        def abort(err):
            return {"hasData": False, "items": {}, "err": err}
        
        compartments = j["compartments_selected"]
        assay_name = j["assay_name"] if "assay_name" in j else None
        biosample_types_selected = j["biosample_types_selected"]
        
        if not biosample_types_selected:
            return abort("no biosample type selected")
        if not set(biosample_types_selected).issubset(self.allBiosampleTypes):
            return abort("invalid biosample type")
        
        # TODO: check value of compartments
        if not compartments:
            return abort("no compartments")

        gene = j["gene"]  # TODO: check for valid gene
        gi = self.pgSearch.geneInfo(gene)
        if not gi:
            return {"assembly": self.assembly,
                    "gene": gene}

        name = gi.approved_symbol
        strand = gi.strand
        
        cge = GeneExpression(self.ps, self.cache, self.assembly)
        r = {"assembly": self.assembly,
             "gene": gene}
        for assay_name in ["total RNA-seq", "polyA RNA-seq", "all"]:
            single = cge.computeHorBars(gene, compartments, biosample_types_selected, assay_name if assay_name != "all" else None)
            mean = cge.computeHorBarsMean(gene, compartments, biosample_types_selected, assay_name if assay_name != "all" else None)
            itemsByRID = cge.itemsByRID
            r[assay_name] = {"assembly": self.assembly,
                             "gene": gene,
                             "strand": strand,
                             "ensemblid_ver": gi.ensemblid_ver,
                             "coords": {"chrom": gi.chrom,
                                        "start": gi.start,
                                        "stop": gi.stop},
                             "single": single,
                             "mean": mean,
                             "itemsByRID": itemsByRID}
        return r

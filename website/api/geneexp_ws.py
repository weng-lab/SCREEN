from __future__ import print_function
import sys
import os

from models.cre import CRE
from models.gene_expression import GeneExpression
from common.pg import PGsearch

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

        self.allBiosampleTypes = set(["immortalized cell line",
                                      "induced pluripotent stem cell line",
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

        biosample_types_selected = j["biosample_types_selected"]
        if not set(biosample_types_selected).issubset(self.allBiosampleTypes):
            return abort("invalid biosample type")
        
        # TODO: check value of compartments
        if not compartments:
            return abort("no compartments")

        accession = j.get("accession", None)
        if accession:
            if not isaccession(accession):
                return abort("invalid accession")
            cre = CRE(self.pgSearch, accession, self.cache)
            nearest = cre.nearbyPcGenes()[0] # nearest gene
            gi = self.pgSearch.geneInfo(nearest["name"])
        else:
            gene = j["gene"]  # TODO: check for valid gene
            gi = self.pgSearch.geneInfo(gene)

        name = gi.approved_symbol
        strand = gi.strand
            
        cge = GeneExpression(self.ps, self.cache, self.assembly)
        r = cge.computeHorBars(name, compartments, biosample_types_selected)
        r["acccession"] = accession
        r["assembly"] = self.assembly
        r["gene"] = name
        r["genename"] = name
        r["ensemblid_ver"] = gi.ensemblid_ver
        r["chrom"] = gi.chrom
        r["start"] = gi.start
        r["stop"] = gi.stop
        return r


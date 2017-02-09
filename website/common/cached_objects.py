#!/usr/bin/env python

import os, sys, json

sys.path.append(os.path.join(os.path.dirname(__file__), "../"))
from models.datasets import Datasets

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from autocomplete import Autocompleter
from constants import paths, PageTitle, chrom_lengths
from pg import PGsearch
from postgres_wrapper import PostgresWrapper
from dbconnect import db_connect
#from models.minipeaks_cache import MiniPeaksCache

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Timer
from db_utils import getcursor

class CachedObjectsWrapper:
    def __init__(self, ps):
        self.cos = {"hg19" : CachedObjects(ps, "hg19"),
                    "mm10" : CachedObjects(ps, "mm10")}

    def __getitem__(self, assembly):
        return self.cos[assembly]

    def getTissue(self, assembly, ct):
        return self.cos[assembly].getTissue(ct)

    def getTissueMap(self, assembly):
        return self.cos[assembly].getTissueMap()

    def getCTTjson(self, assembly):
        return self.cos[assembly].getCTTjson()

    def getTissueAsMap(self, assembly, ct):
        return self.cos[assembly].getTissueAsMap(ct)

    def getTFListJson(self, assembly):
        return self.cos[assembly].getTFListJson()

class CachedObjects:
    def __init__(self, ps, assembly):
        self.ps = ps
        self.pgSearch = PGsearch(ps, assembly)
        self.assembly = assembly

        with Timer("load CachedObjects " + assembly) as t:
            self._load()

    def _load(self):
        self.chromCounts = self.pgSearch.chromCounts()
        self.creHist = self.pgSearch.creHist()

        self.tf_list = self.pgSearch.tfHistoneDnaseList()
        self.tf_list_json = json.dumps(self.tf_list)

        self.datasets = Datasets(self.assembly, self.ps.DBCONN)

        if 0:
            self.minipeaks_caches = {k: MiniPeaksCache(k, 1)
                                     for k in ["dnase", "h3k4me3", "h3k27ac"]}

        self.bigwigmaxes = {}
        bmnp = paths.bigwigmaxes(self.assembly)
        if os.path.exists(bmnp):
            with open(bmnp, "r") as f:
                for line in f:
                    p = line.strip().split("\t")
                    self.bigwigmaxes[p[0]] = int(p[1])

        self.rankMethodToCellTypes = self.pgSearch.rankMethodToCellTypes()
        self.rankMethodToIDxToCellType = self.pgSearch.rankMethodToIDxToCellType()
        self.biosampleTypes = self.datasets.biosample_types
        self.assaymap = {"dnase": self.pgSearch.datasets("DNase"),
                         "h3k27ac": self.pgSearch.datasets("H3K27ac"),
                         "h3k4me3": self.pgSearch.datasets("H3K4me3"),
                         "ctcf" : self.pgSearch.datasets("CTCF")}
        self.ensemblToSymbol = self.pgSearch.genemap()

    def _try_genename(self, s):
        if s in self.ensemblToSymbol:
            return self.ensemblToSymbol[s]
        d = s.split(".")[0]
        if d in self.ensemblToSymbol:
            return self.ensemblToSymbol[d]
        return s
        
    def getTissue(self, ct):
        if ct in self.cellTypeToTissue:
            return self.cellTypesToTissue[ct]
        #raise Exception("missing tissue")
        return ""

    def getTissueMap(self):
        return self.tissueMap

    def getCTTjson(self):
        return self.cellTypesToTissue_json

    def getTissueAsMap(self, ct):
        if ct in self.tissueMap:
            return self.tissueMap[ct]
        #raise Exception("missing tissue")
        return ""

    def getTFListJson(self):
        return self.tf_list_json

    def globalCellTypeInfo(self):
        return self.datasets.globalCellTypeInfoJson()

    def globalCellTypeInfoArr(self):
        return self.datasets.globalCellTypeInfoArrJson()

    def global_data(self, ver):
        from compute_gene_expression import Compartments
        datasets = self.datasets
        return { 
            "tfs" : self.tf_list,
            "cellCompartments" : Compartments,
            "cellTypeInfo": datasets.globalCellTypeInfo,
            "cellTypeInfoArr": datasets.globalCellTypeInfoArr,
            "chromCounts" : self.chromCounts,
            "chromLens" : chrom_lengths[self.assembly],
            "creHistBins" : self.creHist,
        }

    def assayAndCellTypeToExpAndBigWigAccessions(self, assay, ct):
        return self.assaymap[assay][ct]
    
def main():
    DBCONN = db_connect(os.path.realpath(__file__), True)
    
    ps = PostgresWrapper(DBCONN)
    cache = CachedObjects(ps, "mm10")
    pgSearch = PGsearch(ps, "mm10")

    n = pgSearch.datasets("DNase")

    for k, v in cache.assaymap["dnase"].iteritems():
        if v != n[k]:
            print(k, v, n[k])
    
if __name__ == '__main__':
    main()

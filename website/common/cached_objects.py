#!/usr/bin/env python

import os, sys, json

from models.datasets import Datasets

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from autocomplete import Autocompleter
from constants import paths, PageTitle, chrom_lengths
from pg import PGsearch
from models.minipeaks_cache import MiniPeaksCache

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Timer
from db_utils import getcursor

class CachedObjectsWrapper:
    def __init__(self, es, ps):
        self.cos = {"hg19" : CachedObjects(es["hg19"], ps, "hg19"),
                    "mm10" : CachedObjects(es["mm10"], ps, "mm10")}

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
    def __init__(self, es, ps, assembly):
        self.es = es
        self.ps = ps
        self.pgSearch = PGsearch(ps, assembly)
        self.assembly = assembly

        self.chromCounts = self.pgSearch.chromCounts()
        self.creHist = self.pgSearch.creHist()

        #t = Timer("load CachedObjects " + assembly)
        self.tf_list = self.pgSearch.tfHistoneDnaseList()
        self.tf_list_json = json.dumps(self.tf_list)

        self.datasets = Datasets(assembly, ps.DBCONN)

        self.minipeaks_caches = {k: MiniPeaksCache(k, 1)
                                 for k in ["dnase", "h3k4me3", "h3k27ac"]}

        self.bigwigmaxes = {}
        bmnp = paths.bigwigmaxes(assembly)
        if os.path.exists(bmnp):
            with open(bmnp, "r") as f:
                for line in f:
                    p = line.strip().split("\t")
                    self.bigwigmaxes[p[0]] = int(p[1])

        self.rankMethodToCellTypes = self.pgSearch.rankMethodToCellTypes()
        self.rankMethodToIDxToCellType = self.pgSearch.rankMethodToIDxToCellType()
        self.biosampleTypes = self.datasets.biosample_types
        self.assaymap = {"dnase": self._assaymap("/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/%s/raw/DNase-List.txt" % assembly),
                         "h3k27ac": self._assaymap("/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/%s/raw/H3K27ac-List.txt" % assembly),
                         "h3k4me3": self._assaymap("/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/%s/raw/H3K4me3-List.txt" % assembly) }
        self.ensemblToSymbol = self._genemap()

    def _try_genename(self, s):
        if s in self.ensemblToSymbol:
            return self.ensemblToSymbol[s]
        d = s.split(".")[0]
        if d in self.ensemblToSymbol:
            return self.ensemblToSymbol[d]
        return s
        
    def _genemap(self):
        with getcursor(self.ps.DBCONN, "cached_objects$CachedObjects::_genemap") as curs:
            curs.execute("""SELECT ensemblid, approved_symbol
                                FROM {tn}""".format(tn = self.assembly + "_gene_info"))
            results = curs.fetchall()
        return {result[0]: result[1] for result in results}
        
    def _assaymap(self, fnp):
        r = {}
        if os.path.exists(fnp):
            with open(fnp, "r") as f:
                for line in f:
                    p = line.strip().split("\t")
                    if len(p) < 3: continue
                    r[p[2]] = (p[0], p[1])
        return r

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
    

#!/usr/bin/env python

import os, sys, json

from models.datasets import Datasets

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from autocomplete import Autocompleter
from constants import paths
from pg import PGsearch

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Timer
from db_utils import getcursor

MAX = 20000
NCHUNKS = 50
CHUNKSIZE = MAX / NCHUNKS

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
        acs = Autocompleter(es, assembly)
        self.tf_list = acs.tf_list()
        self.tf_list_json = json.dumps(self.tf_list)

        self.datasets = Datasets(assembly, ps.DBCONN)

        self.bigwigmaxes = {}
        if os.path.exists(paths.bigwigmaxes):
            with open(paths.bigwigmaxes, "r") as f:
                for line in f:
                    p = line.strip().split("\t")
                    self.bigwigmaxes[p[0]] = int(p[1])
        print(self.bigwigmaxes)

        self.celltypemap = self.pgSearch.getRankIdxToCellType()
        self.biosampleTypes = self.pgSearch.biosampleTypes()
        
    def getTissue(self, ct):
        if ct in self.cellTypeToTissue:
            return self.cellTypesToTissue[ct]
        #raise Exception("missing tissue")
        print("missing tissue for", ct)
        return ""

    def getTissueMap(self):
        return self.tissueMap

    def getCTTjson(self):
        return self.cellTypesToTissue_json

    def getTissueAsMap(self, ct):
        if ct in self.tissueMap:
            return self.tissueMap[ct]
        #raise Exception("missing tissue")
        print("missing tissue for", ct)
        return ""

    def getTFListJson(self):
        return self.tf_list_json

    def globalCellTypeInfo(self):
        return self.datasets.globalCellTypeInfoJson()

    def globalCellTypeInfoArr(self):
        return self.datasets.globalCellTypeInfoArrJson()

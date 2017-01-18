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

        self.celltypemap = {}
        with getcursor(self.ps.DBCONN, "cached_objects$CachedObjects::__init__") as curs:
            curs.execute("select idx, celltype, rankmethod from {assembly}_rankcelltypeindexex".format(assembly=assembly))
            _map = {}
            for result in curs.fetchall():
                _map[result[2]] = [(result[0], result[1])] if result[2] not in _map else _map[result[2]] + [(result[0], result[1])]
            for k, v in _map.iteritems():
                k = k.lower()
                self.celltypemap[k] = [x[1] for x in sorted(v, lambda a, b: a[0] - b[0])]
                print(k)

    def alltop(self):
        results = {}
        retval = []
        for k, v in self.topelems.iteritems():
            for _k, _v in v.iteritems():
                if _k not in results: retval.append(_v)
                results[_k] = 1
        return retval
                    
    def get20k(self, ct, version):
        results = []

        index = paths.re_json_vers[version][self.assembly]["index"]

        for i in xrange(NCHUNKS):
            try:
                r = self.es.search(body={"query": {"bool": {"must": [{"range": {"ranks.dnase." + ct + ".rank": {"lte": (i + 1) * CHUNKSIZE,
                                                                                                                "gte": i * CHUNKSIZE + 1 }}}]}},
                                         "size": 1000, "_source": ["accession"]},
                                   index=index)
            except:
                print("ES ERROR:", index)
                raise
            try:
                results += r["hits"]["hits"]
            except:
                print("ES ERROR: no hits")
                raise
            return {k: x for k in list(set([x["_source"]["accession"] for x in results]))} # use a dict because fast access is required when computing similar elements

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

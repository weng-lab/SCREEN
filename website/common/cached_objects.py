#!/usr/bin/env python

import os, sys, json

from models.biosamples import Biosamples

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from autocomplete import Autocompleter
from constants import paths

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
        self.assembly = assembly

        t = Timer("load CachedObjects " + assembly)
        acs = Autocompleter(es, assembly)
        self.tf_list = acs.tf_list()
        self.tf_list_json = json.dumps(self.tf_list)

        self.biosamples = Biosamples(assembly, ps.DBCONN)
        self.cellTypesAndTissues = self.biosamples.cellTypesAndTissues
        self.tissueMap = self.biosamples.tissueMap
        self.cellTypesAndTissues_json = self.biosamples.cellTypesAndTissues_json

        self.bigwigmaxes = {}
        bmnp = paths.bigwigmaxes(assembly)
        if os.path.exists(bmnp):
            with open(bmnp, "r") as f:
                for line in f:
                    p = line.strip().split("\t")
                    self.bigwigmaxes[p[0]] = int(p[1])

        dnaselist = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/%s/raw/DNase-List.txt" % assembly
        self.dnasemap = {}
        if os.path.exists(dnaselist):
            with open(dnaselist, "r") as f:
                for line in f:
                    p = line.strip().split("\t")
                    if len(p) < 3: continue
                    self.dnasemap[p[2]] = (p[0], p[1])

                    
        self.celltypemap = {}
        with getcursor(self.ps.DBCONN, "cached_objects$CachedObjects::__init__") as curs:
            curs.execute("select idx, celltype, rankmethod from {assembly}_rankcelltypeindexex".format(assembly=assembly))
            results = curs.fetchall()
        _map = {}
        for result in results:
            _map[result[2]] = [(result[0], result[1])] if result[2] not in _map else _map[result[2]] + [(result[0], result[1])]
        for k, v in _map.iteritems():
            k = k.lower()
            self.celltypemap[k] = [x[1] for x in sorted(v, lambda a, b: a[0] - b[0])]

        

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
        if ct in self.cellTypesAndTissues:
            return self.cellTypesAndTissues[ct]
        #raise Exception("missing tissue")
        return ""

    def getTissueMap(self):
        return self.tissueMap

    def getCTTjson(self):
        return self.cellTypesAndTissues_json

    def getTissueAsMap(self, ct):
        if ct in self.tissueMap:
            return self.tissueMap[ct]
        #raise Exception("missing tissue")
        return ""

    def getTFListJson(self):
        return self.tf_list_json

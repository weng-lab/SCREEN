#!/usr/bin/env python

import os, sys, json

from models.biosamples import Biosamples

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from autocomplete import AutocompleterWrapper

class CachedObjectsWrapper:
    def __init__(self, es, ps):
        self.cos = {"hg19" : CachedObjects(es, ps, "hg19"),
                    "mm10" : CachedObjects(es, ps, "mm10")}

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

        acs = AutocompleterWrapper(es)
        self.tf_list = acs[assembly].tf_list()
        self.tf_list_json = json.dumps(self.tf_list)

        self.biosamples = Biosamples(assembly, ps.DBCONN)
        self.cellTypesAndTissues = self.biosamples.cellTypesAndTissues
        self.tissueMap = self.biosamples.tissueMap
        self.cellTypesAndTissues_json = self.biosamples.cellTypesAndTissues_json
                                   
    def getTissue(self, ct):
        if ct in self.cellTypesAndTissues:
            return self.cellTypesAndTissues[ct]
        #raise Exception("missing tissue")
        print("missing tissue for", ct)
        return ""

    def getTissueMap(self):
        return self.tissueMap
    
    def getCTTjson(self):
        return self.cellTypesAndTissues_json
    
    def getTissueAsMap(self, ct):
        if ct in self.tissueMap:
            return self.tissueMap[ct]
        #raise Exception("missing tissue")
        print("missing tissue for", ct)
        return ""

    def getTFListJson(self):
        return self.tf_list_json

#!/usr/bin/env python

import os, sys, json
import time

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths
from elastic_search_wrapper import ElasticSearchWrapper
from postgres_wrapper import PostgresWrapper
from elasticsearch import Elasticsearch
from autocomplete import AutocompleterWrapper
from load_cell_types import LoadCellTypes

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils

class CachedObjects:
    def __init__(self, es, ps):
        self.es = es
        self.ps = ps

        acs = AutocompleterWrapper(es)
        self.tf_list = {"hg19" : acs["hg19"].tf_list(),
                        "mm10" : acs["mm10"].tf_list()}
        self.tf_list_json = {"hg19" : json.dumps(self.tf_list["hg19"]),
                             "mm10" : json.dumps(self.tf_list["mm10"])}

        self.cellTypesAndTissues = {
            "hg19" : LoadCellTypes.Load(self.ps.DBCONN, "hg19"),
            "mm10" : LoadCellTypes.Load(self.ps.DBCONN, "mm10") }

        def makeTissueMap(assembly):
            return {x["value"]: x["tissue"] for x in
                    self.cellTypesAndTissues[assembly]}
        self.tissueMap = { "hg19" : makeTissueMap("hg19"),
                           "mm10" : makeTissueMap("mm10") }
        self.cellTypesAndTissues_json = {
            "hg19" : json.dumps(self.cellTypesAndTissues["hg19"]),
            "mm10" : json.dumps(self.cellTypesAndTissues["mm10"]) }
                           
    def getTissue(self, ct):
        if ct in self.cellTypesAndTissues:
            return self.cellTypesAndTissues[ct]
        print("missing tissue for", ct)
        return ""

    def getCTTjson(self, assembly):
        return self.cellTypesAndTissues_json[assembly]
    
    def getTissueAsMap(self, ct):
        if ct in self.tissueMap:
            return self.tissueMap[ct]
        print("missing tissue for", ct)
        return ""

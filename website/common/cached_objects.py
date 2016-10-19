#!/usr/bin/env python

import os, sys, json
import time

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths
from elastic_search_wrapper import ElasticSearchWrapper
from postgres_wrapper import PostgresWrapper
from elasticsearch import Elasticsearch
from autocomplete import Autocompleter
from load_cell_types import LoadCellTypes

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils

class CachedObjects:
    def __init__(self, es, ps):
        self.es = es
        self.ps = ps

        ac = Autocompleter(es)
        self.tf_list = sorted(ac.get_suggestions({"userQuery": "",
                                                  "indices": "tfs" })["results"])

        self.cellTypesAndTissues = LoadCellTypes.Load(self.ps.DBCONN)

        self.tf_list_json = json.dumps(self.tf_list)
        self.cellTypesAndTissues_json = json.dumps(self.cellTypesAndTissues)

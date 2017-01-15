#!/usr/bin/env python

from __future__ import print_function

import os, sys, json
import time
import StringIO
import zipfile
import numpy as np

sys.path.append(os.path.join(os.path.dirname(__file__), ".."))
from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from models.expression_matrix import ExpressionMatrix
from models.tss_bar import TSSBarGraph
from models.rank_heatmap import RankHeatmap
from models.correlation import Correlation
from models.cytoband import Cytoband
from models.bigwig import BigWig

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from compute_gene_expression import ComputeGeneExpression
from pg import PGsearch

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from postgres_wrapper import PostgresWrapper
from autocomplete import Autocompleter

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Utils, Timer

class DataWebServiceWrapper:
    def __init__(self, args, ps, cache, staticDir):
        def makeDWS(assembly):
            return DataWebService(args, ps, cache, staticDir, assembly)
        self.dwss = { "hg19" : makeDWS("hg19"),
                      "mm10" : makeDWS("mm10") }

    def process(self, j):
        if "GlobalAssembly" not in j:
            raise Exception("GlobalAssembly not defined")
        if j["GlobalAssembly"] not in ["mm10", "hg19"]:
            raise Exception("invalid GlobalAssembly")
        return self.dwss[j["GlobalAssembly"]].process(j)

class DataWebService:
    def __init__(self, args, ps, cache, staticDir, assembly):
        self.args = args
        self.ps = ps
        self.cache = cache
        self.staticDir = staticDir
        self.assembly = assembly
        self.pgSearch = PGsearch(ps, assembly)

        self.actions = {"cre_table" : self._cre_table}

    def process(self, j):
        #print("DataWebService", "process", j)
        if "action" not in j:
            raise Exception("no action found")
        try:
            return self.actions[j["action"]](j)
        except:
            raise

    def _checkChrom(self, j):
        chrom = j["coord_chrom"]
        if chrom and chrom not in chroms[self.assembly]:
            raise Exception("unknown chrom")
        return chrom

    def _cre_table(self, j):
        chrom = self._checkChrom(j)

        if chrom:
            tableName = '_'.join([self.assembly, "cre", chrom])
        else:
            tableName = '_'.join([self.assembly, "cre"])
        print(tableName)

        return []

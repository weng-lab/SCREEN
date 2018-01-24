#!/usr/bin/env python2

from __future__ import print_function
import os
import sys
import json

sys.path.append(os.path.join(os.path.dirname(__file__), "../"))
from models.datasets import Datasets

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, PageTitle, chrom_lengths
from pg import PGsearch
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from utils import Timer
from db_utils import getcursor

Compartments = ["cell", "nucleoplasm", "cytosol",
                "nucleus", "membrane", "chromatin",
                "nucleolus"]


class CachedObjectsWrapper:
    def __init__(self, ps):
        self.cos = {a: CachedObjects(ps, a) for a in Config.assemblies}

    def __getitem__(self, assembly):
        return self.cos[assembly]


class CachedObjects:
    def __init__(self, ps, assembly):
        self.ps = ps
        self.pgSearch = PGsearch(ps, assembly)
        self.assembly = assembly

        with Timer("loaded CachedObjects " + assembly) as t:
            self._load()

    def _load(self):
        fnp = os.path.join(os.path.dirname(__file__), "colors.json")
        with open(fnp) as f:
            self.colors = json.load(f)

        self.datasets = Datasets(self.assembly, self.pgSearch)

        self.rankMethodToCellTypes = self.pgSearch.rankMethodToCellTypes()
        self.moreTracks = self.pgSearch.loadMoreTracks()

        self.assaymap = {"dnase": self.pgSearch.datasets("DNase"),
                         "h3k27ac": self.pgSearch.datasets("H3K27ac"),
                         "h3k4me3": self.pgSearch.datasets("H3K4me3"),
                         "ctcf": self.pgSearch.datasets("CTCF")}



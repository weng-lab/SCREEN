#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import json

sys.path.append(os.path.join(os.path.dirname(__file__), "../"))
from models.datasets import Datasets

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, PageTitle, chrom_lengths
from pg import PGsearch
from postgres_wrapper import PostgresWrapper
from dbconnect import db_connect
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

        self.chromCounts = self.pgSearch.chromCounts()
        self.creHist = self.pgSearch.creHist()

        self.tf_list = self.pgSearch.tfHistoneDnaseList()

        self.datasets = Datasets(self.assembly, self.pgSearch)

        self.rankMethodToCellTypes = self.pgSearch.rankMethodToCellTypes()
        self.rankMethodToIDxToCellType = self.pgSearch.rankMethodToIDxToCellType()
        self.biosampleTypes = self.datasets.biosample_types
        self.assaymap = {"dnase": self.pgSearch.datasets("DNase"),
                         "h3k27ac": self.pgSearch.datasets("H3K27ac"),
                         "h3k4me3": self.pgSearch.datasets("H3K4me3"),
                         "ctcf": self.pgSearch.datasets("CTCF")}
        self.ensemblToSymbol, self.ensemblToStrand = self.pgSearch.genemap()

        self.nineState = self.pgSearch.loadNineStateGenomeBrowser()
        self.filesList = self.indexFilesTab(self.nineState.values())

        self.moreTracks = self.pgSearch.loadMoreTracks()

        self.geBiosampleTypes = self.pgSearch.geBiosampleTypes()

        self.geneIDsToApprovedSymbol = self.pgSearch.geneIDsToApprovedSymbol()

        self.help_keys = self.pgSearch.getHelpKeys()

        self.tfHistCounts = {
            "peak": self.pgSearch.tfHistCounts(),
            "cistrome": None
        }
        if self.assembly in ["hg38", "mm10"]:
            self.tfHistCounts["cistrome"] = self.pgSearch.tfHistCounts(eset="cistrome")

        self.creBigBeds = self.pgSearch.creBigBeds()

    def lookupEnsembleGene(self, s):
        name = self.ensemblToSymbol.get(s, '')
        strand = self.ensemblToStrand.get(s, '')
        if strand:
            return name, strand

        d = s.split(".")[0]
        name = self.ensemblToSymbol.get(d, '')
        strand = self.ensemblToStrand.get(d, '')
        if strand:
            return name, strand

        if name:
            return name, ''
        return s, ''

    def indexFilesTab(self, rows):
        ret = []
        WWW = "http://bib7.umassmed.edu/~purcarom/screen/ver4/v10"
        for r in rows:
            d = r
            accs = [r["dnase"], r["h3k4me3"], r["h3k27ac"], r["ctcf"]]
            accs = filter(lambda a: a != "NA", accs)
            fn = '_'.join(accs) + ".cREs.bigBed.bed.gz"
            d["fiveGroup"] = [os.path.join(WWW, fn), fn]
            ret.append(d)
        return ret

    def global_data(self, ver):
        datasets = self.datasets
        return {
            "tfs": self.tf_list,
            "cellCompartments": Compartments,
            "cellTypeInfoArr": datasets.globalCellTypeInfoArr,
            "chromCounts": self.chromCounts,
            "chromLens": chrom_lengths[self.assembly],
            "creHistBins": self.creHist,
            "byCellType": datasets.byCellType,
            "geBiosampleTypes": self.geBiosampleTypes,
            "helpKeys": self.help_keys,
            "colors": self.colors,
            "creBigBedsByCellType": self.creBigBeds
        }


def main():
    DBCONN = db_connect(os.path.realpath(__file__))

    ps = PostgresWrapper(DBCONN)
    cache = CachedObjects(ps, "mm10")
    pgSearch = PGsearch(ps, "mm10")

    n = pgSearch.datasets("DNase")

    for k, v in cache.assaymap["dnase"].iteritems():
        print(k, v, n[k])


if __name__ == '__main__':
    main()

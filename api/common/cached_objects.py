#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng



import os
import sys
import json
import requests

sys.path.append(os.path.join(os.path.dirname(__file__), "../"))
from models.datasets import Datasets

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import PageTitle, chrom_lengths
from pg_search import PGsearch
from pg_ge import PGge
from postgres_wrapper import PostgresWrapper
from dbconnect import db_connect
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../utils"))
from utils import Timer


Compartments = ["cell", "nucleoplasm", "cytosol",
                "nucleus", "membrane", "chromatin",
                "nucleolus"]


class CachedObjectsWrapper:
    def __init__(self, pw):
        self.cos = {a: CachedObjects(pw, a) for a in Config.assemblies}

    def __getitem__(self, assembly):
        return self.cos[assembly]


class CachedObjects:
    def __init__(self, pw, assembly):
        self.pw = pw
        self.pgSearch = PGsearch(pw, assembly)
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
        self.accmap = {}
        for _, v in self.assaymap.items():
            for ct, vv in v.items():
                self.accmap[vv[0]] = ct
                self.accmap[vv[1]] = ct
        self.ensemblToSymbol, self.ensemblToStrand = self.pgSearch.genemap()

        self.nineState = self.pgSearch.loadNineStateGenomeBrowser()
        self.filesList = self.indexFilesTab(list(self.nineState.values()))

        self.moreTracks = self.pgSearch.loadMoreTracks()

        self.geBiosampleTypes = self.pgSearch.geBiosampleTypes()

        self.geneIDsToApprovedSymbol = self.pgSearch.geneIDsToApprovedSymbol()
        self.genePGIDsToApprovedSymbol = self.pgSearch.genePGIDsToApprovedSymbol()

        self.help_keys = self.pgSearch.getHelpKeys()

        self.tfHistCounts = {
            "peak": self.pgSearch.tfHistCounts(),
            "cistrome": None
        }
        if self.assembly in ["GRCh38", "mm10"]:
            self.tfHistCounts["cistrome"] = self.pgSearch.tfHistCounts(eset="cistrome")
        if self.assembly == "mm10":
            self.groups = { r[0]: r[1] for r in self.pw.fetchall("groups", "SELECT accession, cgroup FROM mm10_ccre_groups") }
            r = requests.get("http://gcp.wenglab.org/mm10-ccREs.bed").text
            self.groups.update({ x.split()[-2]: x.strip().split()[-1] for x in r.split("\n") if len(x.split()) >= 2 })
            r = requests.get("http://gcp.wenglab.org/Registry-V3/mm10-cCREs.bed").text
            self.groups.update({ x.split()[-2]: x.strip().split()[-1] for x in r.split("\n") if len(x.split()) >= 2 })

        # self.creBigBeds = self.pgSearch.creBigBeds()
        self.creBigBeds = {}
        keys = [ '_', '_', "DNase", "H3K4me3", "H3K27ac", "CTCF" ]
        lumfnp = os.path.join(os.path.dirname(__file__), "../GRCh38-mm10-Look-Up-Matrix.txt")
        with open(lumfnp, 'r') as f:
            for line in f:
                line = line.strip().split('\t')
                self.creBigBeds[line[0]] = {}
                self.creBigBeds[line[0]]["7group"] = "http://gcp.wenglab.org/hubs/integrative1/data/seven-group/%s.7group.bigBed" % ("_".join([ x for x in line[2:] if x != 'NA' ]))
                for i in range(2, len(keys)):
                    if line[i] == "NA": continue
                    self.creBigBeds[line[0]]["9state-%s" % keys[i]] = "http://gcp.wenglab.org/hubs/integrative1/data/nine-state/%s.9state.bigBed" % line[i]
        self.creBeds = self.pgSearch.creBeds()
        self.filesList2 = self.indexFilesTab2(self.creBeds)

        self.cellTypeNameToRNAseqs = {}
        self.rnaseq_exps = PGge(self.pw, self.assembly).rnaseq_exps()
        self.makeCellTypeInfoArr()
        
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
            accs = [a for a in accs if a != "NA"]
            fn = '_'.join(accs) + ".cREs.bigBed.bed.gz"
            d["fiveGroup"] = [os.path.join(WWW, fn), fn]
            ret.append(d)
        return ret

    def indexFilesTab2(self, rows):
        ret = {"agnostic": [],
               "specific": []}
        for biosample, typAcc in rows.items():
            celltypedesc = ''
            tissue = ''
            if "_agnostic" != biosample:
                celltypedesc = self.datasets.byCellType[biosample][0]["cellTypeDesc"]
                tissue = self.datasets.byCellType[biosample][0]["tissue"]
            row = {"celltypename": biosample,
                   "celltypedesc": celltypedesc,
                   "tissue": tissue,
                   "assembly": self.assembly,
                   "5group": "NA",
                   "9state-H3K27ac": "NA",
                   "9state-H3K4me3": "NA",
                   "9state-CTCF": "NA",
                   "9state-DNase": "NA"
            }
            for typ, acc in typAcc.items():
                row[typ] = acc
            if "_agnostic" == biosample:
                ret["agnostic"].append(row)
            else:
                ret["specific"].append(row)
        return ret

    def RNAseqFiles(self, ctn):
        return self.cellTypeNameToRNAseqs[ctn]
    
    def makeCellTypeInfoArr(self):
        def getRNAseqFiles(biosample_summary):
            files = []

            for rnaseq in self.rnaseq_exps[bs]:
                fs = [x for x in rnaseq["signal_files"] if "signal of unique reads" == x["output_type"]]
                if not fs:
                    fs = [x for x in rnaseq["signal_files"] if "plus strand signal of unique reads" == x["output_type"] or "minus strand signal of unique reads" == x["output_type"] or "signal of unique reads" == x["output_type"]]
                files += list(fs)
            return files
        
        ret = []
        
        for ctr in self.datasets.globalCellTypeInfoArr:
            bs = ctr["biosample_summary"]
            ctn = ctr["cellTypeName"]

            files = []
            if bs in self.rnaseq_exps:
                files = getRNAseqFiles(bs)
            self.cellTypeNameToRNAseqs[ctn] = files
                
            ctr["rnaseq"] = len(files) > 0
            ctr["checked"] = False
            
            ret.append(ctr)

        print("loaded", len(list(self.cellTypeNameToRNAseqs.keys())))
        self.cellTypeInfoArr = ret
    
    def global_data(self, ver):
        return {
            "tfs": self.tf_list,
            "cellCompartments": Compartments,
            "cellTypeInfoArr": self.cellTypeInfoArr,
            "chromCounts": self.chromCounts,
            "chromLens": chrom_lengths[self.assembly],
            "creHistBins": self.creHist,
            "byCellType": self.datasets.byCellType,
            "geBiosampleTypes": self.geBiosampleTypes,
            "helpKeys": self.help_keys,
            "colors": self.colors,
            "creBigBedsByCellType": self.creBigBeds,
            "creBedsByCellType": self.creBeds
        }


def main():
    testCONN = db_connect(os.path.realpath(__file__))

    ps = PostgresWrapper(testCONN)
    cache = CachedObjects(ps, "mm10")
    pgSearch = PGsearch(ps, "mm10")

    n = pgSearch.datasets("DNase")

    for k, v in cache.assaymap["dnase"].items():
        print(k, v, n[k])


if __name__ == '__main__':
    main()

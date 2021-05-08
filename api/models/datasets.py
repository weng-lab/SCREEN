#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng

import requests
import json
import os
import sys


class Datasets:
    def __init__(self, assembly, pgSearch):
        self.assembly = assembly

        rows = pgSearch.allDatasets()

        self.globalCellTypeInfo = {}
        # FIXME: cell types will overwrite...
        for r in rows:
            self.globalCellTypeInfo[r["cellTypeName"]] = r

        self.byFileID = {r["fileID"]: r for r in rows}
        self.byCellType = {}
        r = requests.post("https://ga.staging.wenglab.org/graphql", json = {
            "query": """
            query q($assembly: String!) {                                                                                                                                     
                ccREBiosampleQuery(assembly: $assembly) {                                                                                                                                            
                  biosamples {                                                                                                                                                                       
                    name          
                    ontology
                    sampleType
                    dnaseFile: fileAccession(assay: "DNase")
                    h3k4me3File: fileAccession(assay: "H3K4me3")
                    h3k27acFile: fileAccession(assay: "DNase")
                    ctcfFile: fileAccession(assay: "CTCF")
                    dnase: experimentAccession(assay: "DNase")                                                                                                                                       
                    h3k4me3: experimentAccession(assay: "H3K4me3")                                                                                                                                   
                    h3k27ac: experimentAccession(assay: "H3K27ac")                                                                                                                                   
                    ctcf: experimentAccession(assay: "CTCF")                                                                                                                                                            }                                                                                                                                                                                 
                }
            }""", "variables": { "assembly": assembly.lower() }
        }).json()["data"]["ccREBiosampleQuery"]["biosamples"]
        for x in r:
            self.byCellType[x["name"]] = [{
                "assay": a,
                "biosample_summary": x["name"].replace("_", " "),
                "biosample_type": x["sampleType"],
                "cellTypeDesc": x["name"].replace("_", " "),
                "cellTypeName": x["name"],
                "expID": x[a.lower()],
                "fileID": x[a.lower() + "File"],
                "isde": False,
                "name": x["name"].replace("_", " "),
                "synonyms": None,
                "tissue": x["ontology"],
                "value": x["name"]
            } for a in [ "CTCF", "H3K4me3", "H3K27ac", "DNase" ] if x[a.lower()] is not None ]

        # used by trees
        self.biosampleTypeToCellTypes = {}
        for ctn, r in self.globalCellTypeInfo.items():
            bt = r["biosample_type"]
            if bt not in self.biosampleTypeToCellTypes:
                self.biosampleTypeToCellTypes[bt] = []
            self.biosampleTypeToCellTypes[bt].append(ctn)

        # used by CellTypes facet
        self.globalCellTypeInfoArr = []
        for k, v in self.globalCellTypeInfo.items():
            self.globalCellTypeInfoArr.append(v)
        self.globalCellTypeInfoArr = []
        for _, v in self.byCellType.items():
            self.globalCellTypeInfoArr.append(v[0])
        self.globalCellTypeInfoArr.sort(key=lambda v: v["value"].lower())

        self.biosample_types = sorted(list(set([b["biosample_type"]
                                                for b in rows])))


def main():
    from utils import Utils, eprint, AddPath

    AddPath(__file__, '../../common/')
    from dbconnect import db_connect
    from postgres_wrapper import PostgresWrapper

    AddPath(__file__, '../../website/common/')
    from pg import PGsearch
    from cached_objects import CachedObjects
    from pg_common import PGcommon

    testCONN = db_connect(os.path.realpath(__file__))

    ps = PostgresWrapper(testCONN)
    pgSearch = PGsearch(ps, "hg19")
    ds = Datasets("hg19", pgSearch)

    for ctn, vs in ds.byCellType.items():
        for v in vs:
            print(ctn, v)


if __name__ == '__main__':
    main()

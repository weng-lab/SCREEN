#!/usr/bin/env python3

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
        for r in rows:
            ctn = r["cellTypeName"]
            if ctn in self.byCellType:
                self.byCellType[ctn].append(r)
            else:
                self.byCellType[ctn] = [r]

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

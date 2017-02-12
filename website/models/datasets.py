#!/usr/bin/env python

from __future__ import print_function

import json
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from db_utils import getcursor

class Datasets:
    def __init__(self, assembly, pgSearch):
        self.assembly = assembly

        rows = pgSearch.allDatasets()

        self.globalCellTypeInfo = {}
        for r in rows:
            self.globalCellTypeInfo[r["cellTypeName"]] = r

        # used by trees
        self.biosampleTypeToCellTypes = {}
        for ctn, r in self.globalCellTypeInfo.iteritems():
            bt = r["biosample_type"]
            if bt not in self.biosampleTypeToCellTypes:
                self.biosampleTypeToCellTypes[bt] = []
            self.biosampleTypeToCellTypes[bt].append(ctn)

        # used by CellTypes facet
        self.globalCellTypeInfoArr = []
        for k, v in self.globalCellTypeInfo.iteritems():
            self.globalCellTypeInfoArr.append(v)
        self.globalCellTypeInfoArr.sort(key=lambda v: v["value"].lower())

        self.biosample_types = sorted(list(set([b["biosample_type"]
                                                for b in rows])))

        self.globalCellTypeInfo_json = json.dumps(self.globalCellTypeInfo)
        self.globalCellTypeInfoArr_json = json.dumps(self.globalCellTypeInfoArr)

    def tissue(self, ct):
        return self.cellTypeToTissue.get(ct, "")

    def biosampleName(self, ct):
        return self.cellTypeToBiosampleName.get(ct, "")

    def globalCellTypeInfoJson(self):
        return self.globalCellTypeInfo_json

    def globalCellTypeInfoArrJson(self):
        return self.globalCellTypeInfoArr_json

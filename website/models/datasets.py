#!/usr/bin/env python

from __future__ import print_function

import json
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from db_utils import getcursor

class Dataset:
    def __init__(self, r):
        self.assay = r[0]
        self.expID = r[1]
        self.fileID = r[2]
        self.tissue = r[3]
        self.biosample_summary = r[4]
        self.biosample_type = r[5]
        self.cellTypeName = r[6]

class Datasets:
    def __init__(self, assembly, DBCONN):
        self.assembly = assembly
        self.DBCONN = DBCONN

        tableName = self.assembly + "_datasets"
        cols = ["assay", "expID", "fileID", "tissue", "biosample_summary",
                "biosample_type", "cellTypeName"]

        with getcursor(DBCONN, "datasets") as curs:
            curs.execute("""
SELECT {cols} FROM {tn}""".format(tn = tableName, cols = ','.join(cols)))
            rows = [Dataset(r) for r in curs.fetchall()]

        self.globalCellTypeInfo = {}
        for r in rows:
            self.globalCellTypeInfo[r.cellTypeName] = {}
            self.globalCellTypeInfo[r.cellTypeName]["tissue"] = r.tissue
            self.globalCellTypeInfo[r.cellTypeName]["name"] = r.biosample_summary

        self.globalCellTypeInfoArr = []
        for k, v in self.globalCellTypeInfo.iteritems():
            self.globalCellTypeInfoArr.append({"value": k,
                                               "tissue": v["tissue"],
                                               "name": v["name"]})
        self.globalCellTypeInfoArr.sort(key=lambda v: v["value"].lower())

        self.biosample_types = sorted(list(set([b.biosample_type
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

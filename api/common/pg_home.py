#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


import sys
import os
import psycopg2.extras

from config import Config

class PGHome:
    def __init__(self, pw):
        self.pw = pw

    def inputData(self):
        files = []

        rows = self.pw.fetchallAsNamedTuples("intputData", """
        SELECT runDate FROM {tableName}
        """.format(tableName = "hg19_peakintersectionsmetadata_runDate"))
        version = rows[0][0]
            
        for assembly in Config.assemblies:
            rows = self.pw.fetchallAsDict("intputData", """
            SELECT %(assembly)s as assembly, 
            biosample_term_name, 
            array_agg(fileid) AS fileids
            FROM {tableName}
            GROUP BY biosample_term_name
            ORDER BY biosample_term_name
            """.format(tableName = assembly + "_peakintersectionsmetadata"),
                                                 {"assembly": assembly})
            files += [r for r in rows]
            
        return {"files": files,
                "version": version}

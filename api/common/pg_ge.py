#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


import sys
import os

class PGge(object):
    def __init__(self, pw, assembly):
        self.pw = pw
        self.assembly = assembly

    def rnaseq_exps(self):
        rows = self.pw.fetchall("PGge$rnaseq_exps", """
        SELECT biosample_summary, expID, fileID, signal_files
        FROM {tn}
        """.format(tn=self.assembly + "_rnaseq_exps"))
        
        ret = {}
        for r in rows:
            biosample_summary = r[0]
            if biosample_summary not in ret:
                ret[biosample_summary] = []
            ret[biosample_summary].append({"expID": r[1],
                                           "fileID": r[2],
                                           "signal_files": r[3]})
        return ret
            


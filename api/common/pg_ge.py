#!/usr/bin/env python3

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
            


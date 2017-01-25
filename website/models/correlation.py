#!/usr/bin/env python

import sys
import os
import numpy as np

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from db_utils import getcursor
from dbconnect import db_connect

class Correlation:
    def __init__(self, assembly, DBCONN, cache):
        self.assembly = assembly
        self.DBCONN = DBCONN
        self.cache = cache
        self.tableName = assembly + "_correlations"

    def dbcorr(self, assembly, tableName, rankMethod, cellTypes):
        with getcursor(self.DBCONN, "Correlation::dbcorr") as curs:
            curs.execute("""
SELECT correlations, assay FROM {tn} WHERE assay = %s
""".format(tn = self.tableName), (tableName,))
            try:
                r = curs.fetchone()[0]
            except:
                raise Exception("correlation$Correlation::dbcorr ERROR: failed to get correlation data for assay %s" % assay)
        if not r:
            return None, None

        ctToIdx = self.cache.rankMethodToIDxToCellType[rankMethod] # 1 based!
        tokeep = []
        flabels = []
        for ct in cellTypes:
            idx = ctToIdx[ct] - 1
            tokeep.append(idx)
            obj = self.cache.datasets.globalCellTypeInfo[ct]
            obj["key"] = ct
            flabels.append(obj)

        dim = len(tokeep)
        ret = np.empty((dim, dim))
        for i in xrange(dim):
            for j in xrange(dim):
                ret[i][j] = r[tokeep[i]][tokeep[j]]
        #print(flabels)
        return (flabels, ret)

if __name__ == "__main__":
    DBCONN = db_connect(os.path.realpath(__file__), True)
    print(Correlation(sys.argv[1], DBCONN).dbcorr(sys.argv[1], "dnase"))

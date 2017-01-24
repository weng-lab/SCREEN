#!/usr/bin/env python

import sys
import os

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

    def dbcorr(self, assembly, assay, labels = None, _filter = lambda x: True):
        with getcursor(self.DBCONN, "Correlation::dbcorr") as curs:
            curs.execute("""
SELECT correlations, assay FROM {tn} WHERE assay = %s
""".format(tn = self.tableName), (assay,))
            try:
                r = curs.fetchone()[0]
            except:
                raise Exception("correlation$Correlation::dbcorr ERROR: failed to get correlation data for assay %s" % assay)
        if not labels:
            return r

        tokeep = []
        flabels = []
        for i in xrange(len(labels)):
            if _filter(labels[i]):
                tokeep.append(i)
                obj = self.cache.datasets.globalCellTypeInfo[labels[i]]
                obj["key"] = labels[i]
                flabels.append(obj)
        ret = [[0 for j in xrange(len(tokeep))] for i in xrange(len(tokeep))]
        for i in xrange(len(tokeep)):
            for j in xrange(len(tokeep)):
                ret[i][j] = r[tokeep[i]][tokeep[j]]
        #print(flabels)
        return (flabels, ret)

if __name__ == "__main__":
    DBCONN = db_connect(os.path.realpath(__file__), True)
    print(Correlation(sys.argv[1], DBCONN).dbcorr(sys.argv[1], "dnase"))

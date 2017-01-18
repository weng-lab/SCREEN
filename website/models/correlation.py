import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
from db_utils import getcursor

class Correlation:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN

    def dbcorr(self, assembly, assay, labels = None, _filter = lambda x: True):
        assay = assay.replace("-", "_").replace("+", "_")
        with getcursor(self.DBCONN, "Correlation::dbcorr") as curs:
            curs.execute(
                """SELECT correlations FROM {tn}WHERE assay = %s
""".format(tn = "correlations_" + self.assembly), (assay = assay))
            r = curs.fetchone()[0]
        tokeep = []
        flabels = []
        for i in xrange(len(labels)):
            if _filter(labels[i]):
                tokeep.append(i)
                flabels.append(labels[i])
        ret = [[0 for j in xrange(len(tokeep))] for i in xrange(len(tokeep))]
        for i in xrange(len(tokeep)):
            for j in xrange(len(tokeep)):
                ret[i][j] = r[tokeep[i]][tokeep[j]]
        return (flabels, ret)

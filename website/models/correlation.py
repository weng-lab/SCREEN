import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../../../metadata/utils"))
sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from db_utils import getcursor
from dbconnect import db_connect

class Correlation:
    def __init__(self, assembly, DBCONN):
        self.assembly = assembly
        self.DBCONN = DBCONN

    def tn(self, assembly):
        return "correlations_hg19" if assembly == "hg19" else assembly + "_correlations"
        
    def dbcorr(self, assembly, assay, labels = None, _filter = lambda x: True):
        assay = assay.replace("-", "_").replace("+", "_")

        lookup = {"dnase_h3k27ac" : "h3k27ac_dnase",
                  "dnase_h3k4me3" : "h3k4me3_dnase",
                  "dnase_ctcf" : "ctcf_dnase"}
        if assay in lookup:
            assay = lookup[assay]

        with getcursor(self.DBCONN, "Correlation::dbcorr") as curs:
            curs.execute(
                """SELECT correlations, assay FROM {tn} WHERE assay = '{assay}'""".format(tn = self.tn(assembly), assay = assay + "v12"))
            try:
                r = curs.fetchone()[0]
            except:
                raise Exception("correlation$Correlation::dbcorr ERROR: failed to get correlation data for assay %s" % assay)
            if not labels: return r

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

if __name__ == "__main__":
    DBCONN = db_connect(os.path.realpath(__file__), True)
    print(Correlation(sys.argv[1], DBCONN).dbcorr(sys.argv[1], "dnase"))

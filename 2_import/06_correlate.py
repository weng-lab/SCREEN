#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer
from get_yes_no import GetYesNoToQuestion

class Correlate:

    def __init__(self, DBCONN, assembly):
        self.DBCONN = DBCONN
        self.tableName = assembly + "_correlations"
        if self.tableName == "hg19_correlations":
            self.tableName = "correlations_hg19"
        self.qTableName = assembly + "_cre"

    def exportTable(self, fnp):
        print("exporting CSV to", fnp)
        with getcursor(self.DBCONN, "Correlate::exportTable") as curs:
            with gzip.open(fnp, 'wb') as f:
                curs.copy_to(f, self.tableName, '\t',
                             columns = ["assay", "correlations"])

    def importTable(self, fnp):
        self.setupTable()
        with getcursor(self.DBCONN, "Correlate::importTable") as curs:
            with gzip.open(fnp) as f:
                curs.copy_from(f, self.tableName, '\t',
                               columns = ["assay", "correlations"])

    def setupTable(self):
        print("dropping and creating", self.tableName, "...")
        with getcursor(self.DBCONN, "Correlate::setupTable") as curs:
            curs.execute("""
            DROP TABLE IF EXISTS {tableName};
            CREATE TABLE {tableName}
            (id serial PRIMARY KEY,
            assay VARCHAR(20),
            correlations double precision[][]);""".format(tableName = self.tableName))

    def _getarrlen(self, field):
        with getcursor(self.DBCONN, "Correlate::setupTable") as curs:
            curs.execute("""
SELECT array_length((SELECT {field} from {tableName} LIMIT 1), 1)
""".format(field = field, tableName = self.qTableName))
            r = curs.fetchone()[0]
        return r

    def _getcorr(self, field, i, l, threshold):
        with Timer("computing correlation for ct %d/%d, assay %s" % (i, l, field)):
            q = ", ".join(["corr(%s[%d], %s[%d])" % (field + "_zscore", i + 1, field + "_zscore", j + 1)
                           for j in range(i + 1, l)])
            with getcursor(self.DBCONN, "Correlate::setupTable") as curs:
                curs.execute("""
SELECT {q} FROM {tableName}
WHERE intarray2int4range({field}) && int4range(0, {threshold})
""".format(tableName=self.qTableName,
           threshold=threshold,
           field=field + "_rank",
           q=q))
                r = curs.fetchone()
        return r

    def insertmatrix(self, assay, matrix):
        print("inserting %s" % assay)
        with getcursor(self.DBCONN, "Correlate::insertmatrix") as curs:
            curs.execute("""
INSERT INTO {tableName} (assay, correlations)
            VALUES (%(assay)s, %(corrs)s)
            """.format(tableName = self.tableName), {"assay": assay, "corrs": matrix})

    def run(self, assay):
        l = self._getarrlen(assay + "_rank")
        corrs = [[1.0 for ct in xrange(l)] for ct in xrange(l)]
        for ct in xrange(l - 1):
            r = [self._getcorr(assay, ct, l, 20000) for ct in xrange(l)]
            for i in range(ct + 1, l):
                corrs[ct][i] = r[i - ct - 1]
                corrs[i][ct] = r[i - ct - 1]
        self.curs.execute("""
INSERT INTO {tableName} (assay, correlations)
VALUES (%(assay)s, %(corrs)s)
""".format(tableName = self.tableName),
                          {"assay": assay, "corrs": corrs})

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--exportTable', action="store_true", default=False)
    parser.add_argument('--importTable', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="mm10")
    args = parser.parse_args()
    return args

def loadmatrix(fnp):
    r = []
    with open(fnp, "r") as f:
        for line in f:
            toks = line.rstrip().split('\t')
            r.append([float(x) for x in toks])
    return r

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    assaymap = {"DNase": "dnase",
                "CTCF": "ctcf_only",
                "Insulator": "ctcf_dnase",
                "Promoter": "h3k4me3_dnase",
                "H3K4me3": "h3k4me3_only",
                "H3K27ac": "h3k27ac_only",
                "Enhancer": "h3k27ac_dnase" }

    for assembly in ["mm10", "hg19"]:
        print("working with assembly %s" % assembly)
        c = Correlate(DBCONN, assembly)
        if args.exportTable:
            c.exportTable(fnp)
        elif args.importTable:
            c.setupTable()
            d = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/ver9/%s/mat" % assembly
            for assay in ["DNase", "H3K27ac", "H3K4me3", "Enhancer", "Promoter", "Insulator", "CTCF"]:
                fnp = os.path.join(d, "%s-List.txt.cormat.txt" % assay)
                if not os.path.exists(fnp):
                    print("WARNING: missing matrix for assay %s; skipping" % fnp)
                    continue
                try:
                    matrix = loadmatrix(fnp)
                    c.insertmatrix(assaymap[assay] + "v10", matrix)
                except:
                    print("error in", fnp)
                    raise
        else:
            c.setupTable()
            for assay in ["dnase", "ctcf_only", "h3k27ac_only",
                          "h3k4me3_only", "h3k27ac_dnase", "h3k4me3_dnase",
                          "ctcf_dnase" ]:
                c.run(assay)
    return 0

if __name__ == '__main__':
    main()

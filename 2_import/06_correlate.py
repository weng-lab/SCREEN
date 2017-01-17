#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, Timer

class Correlate:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.tableName = "correlations_" + assembly
        self.qTableName = assembly + "_cre"

    def setupTable(self):
        print("dropping and creating", self.tableName, "...")
        self.curs.execute("""
            DROP TABLE IF EXISTS {tableName};
            CREATE TABLE {tableName}
            (id serial PRIMARY KEY,
            assay VARCHAR(20),
            correlations integer[][]);
""".format(tableName = self.tableName))
        print("\tok")

    def _getarrlen(self, field):
        self.curs.execute("SELECT array_length((SELECT {field} from {tableName} LIMIT 1), 1)".format(field = field, tableName = self.qTableName))
        r = self.curs.fetchone()[0]
        return r

    def _getcorr(self, field, i, l, threshold):
        with Timer("computing correlation for ct %d/%d, assay %s" % (i, l, field)):
            q = ", ".join(["corr(%s[%d], %s[%d])" % (field + "_zscore", i + 1, field + "_zscore", j + 1)
                           for j in range(i + 1, l)])
            self.curs.execute("""
SELECT {q} FROM {tableName}
WHERE intarray2int4range({field}) && int4range(0, {threshold})
""".format(tableName=self.qTableName,
           threshold=threshold,
           field=field + "_rank",
           q=q))
            return self.curs.fetchone()

    def run(self, assay):
        print("running", assay)
        l = self._getarrlen(assay + "_rank")
        corrs = [[1.0 for ct in xrange(l)] for ct in xrange(l)]
        for ct in xrange(l - 1):
            print("computing corrs...")
            r = [self._getcorr(assay, ct, l, 20000) for ct in xrange(l)]
            print("merging corrs...")
            for i in range(ct + 1, l):
                corrs[ct][i] = r[i - ct - 1]
                corrs[i][ct] = r[i - ct - 1]
        print("saving corrs...")
        self.curs.execute("""
INSERT INTO {tableName} (assay, correlations)
VALUES (%(assay)s, %(corrs)s)
""".format(tableName = self.tableName),
                          {"assay": assay, "corrs": corrs})

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="mm10")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    with getcursor(DBCONN, "correlate") as curs:
        c = Correlate(curs, "mm10")
        c.setupTable()
        for assay in ["dnase", "ctcf_only", "h3k27ac_only", "h3k4me3_only",
                      "h3k27ac_dnase", "h3k4me3_dnase", "ctcf_dnase" ]:
            c.run(assay)
    return 0

if __name__ == '__main__':
    main()

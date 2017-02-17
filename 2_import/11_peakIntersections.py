#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../1_pipeline/'))
peakIntersections = __import__('03_beds_es')

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs

class ImportPeakIntersections:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_" + "peakIntersections"

    def setupTable(self):
        printt("dropping and creating table", self.tableName)
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
    CREATE TABLE {tableName}(
    id serial PRIMARY KEY,
    accession text,
    tf jsonb,
    histone jsonb,
    dnase jsonb
    );
    """.format(tableName = self.tableName))

    def run(self):
        dataF = "/project/umw_zhiping_weng/0_metadata/encyclopedia/Version-4/"
        dataF = os.path.join(dataF, "ver9", self.assembly, "newway")
        fnp = os.path.join(dataF, "peakIntersections.tsv.gz")
        self.setupTable()

        cols = "accession tf histone dnase".split(' ')
        printt("copying in data...")
        with gzip.open(fnp) as f:
            self.curs.copy_from(f, self.tableName, '\t', columns=cols)
        printt("\tcopied in", fnp, self.curs.rowcount)

    def index(self):
        makeIndex(self.curs, self.tableName, ["accession"])

class ImportPeakIntersectionMetadata:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_" + "peakIntersectionsMetadata"

    def setupTable(self):
        printt("dropping and creating table", self.tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}(
id serial PRIMARY KEY,
expID text,
fileID text,
assay text,
label text,
biosample_term_name text
)""".format(tn = self.tableName))

    def run(self):
        self.setupTable()

        jobs = peakIntersections.makeJobs(self.assembly)

        outF = StringIO.StringIO()
        for r in jobs:
            outF.write('\t'.join([r["bed"].expID,
                                  r["bed"].fileID,
                                  r["etype"],
                                  r["exp"].label,
                                  r["exp"].biosample_term_name
                                  ]) + '\n')
        outF.seek(0)

        cols = "expID fileID assay label biosample_term_name".split(' ')
        self.curs.copy_from(outF, self.tableName, '\t', columns=cols)
        printt("\tcopied in", self.curs.rowcount)

        makeIndex(self.curs, self.tableName, ["label", "fileID"])

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--index', action="store_true", default=False)
    parser.add_argument('--metadata', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for assembly in ["mm10", "hg19"]:
        with getcursor(DBCONN, "main") as curs:
            if args.metadata:
                ipi = ImportPeakIntersectionMetadata(curs, assembly)
                ipi.run()
            elif args.index:
                ipi = ImportPeakIntersections(curs, assembly)
                ipi.index()
            else:
                ipm = ImportPeakIntersectionMetadata(curs, assembly)
                ipm.run()

                ipi = ImportPeakIntersections(curs, assembly)
                ipi.run()
                ipi.index()


if __name__ == '__main__':
    main()

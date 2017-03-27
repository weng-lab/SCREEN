#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../1_pipeline/'))
peakIntersections = __import__('03_peak_intersection')

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs

class ImportPeakIntersections:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_peakIntersections"

    def setupTable(self):
        printt("dropping and creating table", self.tableName)
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
    CREATE TABLE {tableName}(
    id serial PRIMARY KEY,
    accession text,
    tf jsonb,
    histone jsonb
    );
    """.format(tableName = self.tableName))

    def run(self):
        self.setupTable()

        cols = ["accession", "tf", "histone"]

        fnp = paths.path(self.assembly, "extras", "peakIntersections.json.gz")
        printt("copying in data", fnp)
        with gzip.open(fnp) as f:
            self.curs.copy_from(f, self.tableName, '\t', columns=cols)
        printt("\tcopied in", fnp, self.curs.rowcount)

    def index(self):
        makeIndex(self.curs, self.tableName, ["accession"])

class ImportPeakIntersectionMetadata:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_peakIntersectionsMetadata"

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

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
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

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--index', action="store_true", default=False)
    parser.add_argument('--metadata', action="store_true", default=False)
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)
        
if __name__ == '__main__':
    main()

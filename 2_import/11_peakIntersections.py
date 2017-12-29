#!/usr/bin/env python2

from __future__ import print_function
import os
import sys
import json
import psycopg2
import argparse
import gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../1_screen_pipeline/03_peak_intersection'))
peakIntersections = __import__('01_peak_intersection')

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs


class ImportPeakIntersections:
    def __init__(self, curs, assembly, tsuffix, runDate):
        self.curs = curs
        self.assembly = assembly
        self.tableName = "_".join((assembly, tsuffix))
        self._tsuffix = tsuffix
        self.runDate = runDate
        
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
    """.format(tableName=self.tableName))

    def run(self):
        self.setupTable()

        cols = ["accession", "tf", "histone"]

        fnp = paths.path(self.assembly, "extras", self.runDate,
                         "%s.json.gz" % self._tsuffix)
        printt("copying in data", fnp)
        with gzip.open(fnp) as f:
            self.curs.copy_from(f, self.tableName, '\t', columns=cols)
        printt("\tcopied in", fnp, self.curs.rowcount)

    def index(self):
        makeIndex(self.curs, self.tableName, ["accession"])


def encode_peak_metadata(assembly, t, curs):
    printt("dropping and creating table", t)
    curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}(
id serial PRIMARY KEY,
expID text,
fileID text,
assay text,
label text,
biosample_term_name text
)""".format(tn=t))
    pi = peakIntersections.PeakIntersection({}, assembly)
    jobs, runDate = pi.loadJobs()
    outF = StringIO.StringIO()
    for r in jobs:
        outF.write('\t'.join([r["bed"]["expID"],
                              r["bed"]["fileID"],
                              r["etype"],
                              r["exp"]["label"],
                              r["exp"]["biosample_term_name"]
                              ]) + '\n')
    outF.seek(0)
    cols = "expID fileID assay label biosample_term_name".split(' ')
    return (outF, cols, runDate)


class ImportPeakIntersectionMetadata:
    def __init__(self, curs, assembly, tsuffix, jobgen):
        self.curs = curs
        self.assembly = assembly
        self.tableName = assembly + "_%sMetadata" % tsuffix
        self._tsuffix = tsuffix
        self._jobgen = jobgen

    def run(self):
        outF, cols, runDate = self._jobgen(self.assembly, self.tableName, self.curs)
        self.curs.copy_from(outF, self.tableName, '\t', columns=cols)
        printt("\tcopied in", self.curs.rowcount)
        makeIndex(self.curs, self.tableName, ["label", "fileID"])
        return runDate

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    Encode = ["peakIntersections", encode_peak_metadata]

    def doRun(args, assembly, curs, tsuffix, jobgen):
        if args.metadata:
            ImportPeakIntersectionMetadata(curs, assembly, tsuffix, jobgen).run()
        elif args.index:
            ImportPeakIntersections(curs, assembly, tsuffix).index()
        else:
            m = ImportPeakIntersectionMetadata(curs, assembly, tsuffix, jobgen)
            runDate = m.run()
            ipi = ImportPeakIntersections(curs, assembly, tsuffix, runDate)
            ipi.run()
            ipi.index()

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "main") as curs:
            doRun(args, assembly, curs, Encode[0], Encode[1])


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

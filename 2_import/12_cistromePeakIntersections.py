#!/usr/bin/env python2

from __future__ import print_function
import os
import sys
import json
import psycopg2
import argparse
import gzip
import StringIO

PI = __import__('11_peakIntersections')
sys.path.append(os.path.join(os.path.dirname(__file__), '../1_screen_pipeline/03_peak_intersection'))
cistromeIntersections = __import__('02_cistrome')

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange
from files_and_paths import Dirs


def cistrome_peak_metadata(assembly, t, curs):
    printt("dropping and creating table", t)
    curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}(
id serial PRIMARY KEY,
fileID text,
assay text,
label text,
biosample_term_name text,
tissue text
)""".format(tn=t))
    jobs = peakIntersections.loadJobs(assembly, Config.peakIntersectionRunDate)
    outF = StringIO.StringIO()
    for r in jobs:
        outF.write("\t".join([r["bed"]["fileID"],
                              r["etype"], r["label"],
                              r["celltype"], r["tissue"]]) + "\n")
    outF.seek(0)
    cols = ["fileID", "assay", "label", "biosample_term_name", "tissue"]
    return (outF, cols, "")


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    Cistrome = ["cistromeIntersections", cistrome_peak_metadata]

    def doRun(args, assembly, curs, tsuffix, jobgen):
        if args.metadata:
            PI.ImportPeakIntersectionMetadata(curs, assembly, tsuffix, jobgen).run()
        elif args.index:
            PI.ImportPeakIntersections(curs, assembly, tsuffix).index()
        else:
            PI.ImportPeakIntersectionMetadata(curs, assembly, tsuffix, jobgen).run()
            runDate = Config.cistromePeakIntersectionRunDate
            ipi = PI.ImportPeakIntersections(curs, assembly, tsuffix, runDate)
            ipi.run()
            ipi.index()

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "main") as curs:
            doRun(args, assembly, curs, Cistrome[0], Cistrome[1])
            if assembly in ["hg38", "mm10"]:
                doRun(args, assembly, curs, Cistrome[0], Cistrome[1])


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

#!/usr/bin/env python

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng


from __future__ import print_function
import os
import sys
import json
import psycopg2
import argparse
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect
from config import Config
from table_names import GeData, GeExperimentList, GeMetadata

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor, makeIndex, makeIndexRev, makeIndexArr, makeIndexIntRange, makeIndexMultiCol
from files_and_paths import Dirs, Tools, Genome
from exp import Exp
from utils import Utils, printt
from metadataws import MetadataWS


class LoadRNAseq:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def _tableNameData(self, isNormalized):
        return GeData(self.assembly, isNormalized)

    def _tableNameExperimentList(self):
        return GeExperimentList(self.assembly)

    def _tableNameMetadata(self):
        return GeMetadata(self.assembly)

    def setupDB(self):
        tableName = self._tableNameMetadata()
        printt("dropping and creating", tableName)

        self.curs.execute("""
    DROP TABLE IF EXISTS {tn};

    CREATE TABLE {tn}
    (id serial PRIMARY KEY,
    expID text,
    fileID text,
    replicate INT NOT NULL,
    cellType text,
    organ text,
    cellCompartment text,
    target text,
    lab text,
    assay_term_name text,
    biosample_type text,
    biosample_term_name text,
    biosample_summary text,
    ageTitle text,
    assay_title text,
    signal_files jsonb
    )""".format(tn=tableName))

    def _organ(self, exp, j, lookup):
        biosample = j["replicates"][0]["library"]["biosample"]
        organ = ""

        organ_slims = sorted(j["organ_slims"])
        if 0 == len(organ_slims):
            print("DCC needs to fix missing organ_slims JSON field for", exp.encodeID)
        else:
            organ = organ_slims[0]

        if biosample["biosample_term_name"] in lookup:
            organ = lookup[biosample["biosample_term_name"]]

        if not organ or "na" == organ:
            print("POTENTIAL ERROR: missing organ", "'" + biosample["biosample_term_name"] + "'")
            organ = ""  # biosample["biosample_term_name"]

        return organ

    def _cellCompartment(self, exp, j):
        try:
            cellCompartment = j["replicates"][0]["library"]["biosample"]["subcellular_fraction_term_name"]
        except:
            #print(expID, "assuming cell compartment")
            cellCompartment = "cell"

        return cellCompartment

    def _ageTitle(self, exp, j):
        ageTitle = ''
        try:
            if 'mm10' == self.assembly:
                bs = j["replicates"][0]["library"]["biosample"]
                life_stage = bs.get("life_stage", "")
                age_units = bs.get("age_units", "")
                age = bs.get("age", "")
                toks = [x for x in [life_stage, age, age_units] if x and x != "unknown"]
                ageTitle = ''
                if toks:
                    ageTitle = '(' + ' ' .join(toks) + ')'
                # print(ageTitle)
        except:
            raise
            ageTitle = ''
        return ageTitle

    def _signalFiles(self, exp, replicate):
        ret = []
        for f in exp.files:
            if not f.isBigWig():
                continue
            if f.biological_replicates != [replicate]:
                continue
            if f.assembly != self.assembly:
                continue
            j = {"fileID": f.fileID,
                 "output_type": f.output_type,
                 "expID": exp.encodeID,
                 "replicate": replicate}
            ret.append(j)
        return ret

    def processRow(self, row, outF, lookup):
        expID = row[0]
        fileID = row[1]
        replicate = row[2]
        exp = Exp.fromJsonFile(expID)
        j = exp.getExpJson()

        organ = self._organ(exp, j, lookup)
        cellCompartment = self._cellCompartment(exp, j)
        ageTitle = self._ageTitle(exp, j)
        signalFiles = self._signalFiles(exp, replicate)

        a = [expID,
             fileID,
             exp.biosample_term_name,
             organ,
             cellCompartment,
             exp.target,
             exp.lab,
             exp.assay_term_name,
             exp.biosample_type,
             exp.biosample_term_name,
             exp.biosample_summary,
             ageTitle,
             j["assay_title"],
             str(replicate),
             json.dumps(signalFiles)
        ]
        # print(a)
        outF.write('\t'.join(a) + '\n')

    def patchOrgan(self):
        tissueFixesFnp = os.path.join(os.path.dirname(__file__), "cellTypeFixesEncode.txt")
        with open(tissueFixesFnp) as f:
            rows = f.readlines()
        lookup = {}
        for idx, r in enumerate(rows):
            toks = r.rstrip().split('%')
            if len(toks) != 2:
                raise Exception("wrong number of tokens on line " + str(idx + 1) + ": "
                                -                                + r + "found " + str(len(toks)))
            lookup[toks[0]] = toks[1].strip()
        return lookup

    def insertRNAs(self):
        printt("getting list of experiments")
        q = """
SELECT expID, fileID, replicate
FROM {tableName}
""".format(tableName = self._tableNameExperimentList())

        self.curs.execute(q)
        rows = self.curs.fetchall()
        printt("found", len(rows), "rows")

        lookup = self.patchOrgan()

        printt("loading metadata")
        outF = StringIO.StringIO()
        for row in rows:
            self.processRow(row, outF, lookup)
        outF.seek(0)

        cols = ["expID", "fileID", "cellType", "organ",
                "cellCompartment", "target", "lab",
                "assay_term_name", "biosample_type", "biosample_term_name",
                "biosample_summary", "ageTitle", "assay_title", "replicate", "signal_files"]

        self.curs.copy_from(outF, self._tableNameMetadata(), '\t', columns=cols)
        printt("inserted", self.curs.rowcount)

    def doIndex(self):
        tableName = self._tableNameMetadata()
        makeIndex(self.curs, tableName, ["expID", "celltype"])
        makeIndexMultiCol(self.curs, tableName, ["cellCompartment", "biosample_type"])


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        with getcursor(DBCONN, "02_init") as curs:
            print('***********', assembly)
            lr = LoadRNAseq(curs, assembly)
            if args.index:
                lr.doIndex()
            else:
                lr.setupDB()
                lr.insertRNAs()
                lr.doIndex()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--index', action="store_true", default=False)
    args = parser.parse_args()
    return args


def main():
    args = parse_args()
    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)
    return 0


if __name__ == '__main__':
    sys.exit(main())

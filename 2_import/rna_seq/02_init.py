#!/usr/bin/env python

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

    def setupDB(self):
        tableName = "r_rnas_" + self.assembly
        printt("dropping and creating", tableName)

        self.curs.execute("""
    DROP TABLE IF EXISTS {tn};

    CREATE TABLE {tn}
    (id serial PRIMARY KEY,
    encode_id text,
    cellType text,
    organ text,
    cellCompartment text,
    target text,
    lab text,
    assay_term_name text,
    biosample_type text,
    ageTitle text
    )""".format(tn=tableName))

    def processRow(self, row, outF, lookup):
        encodeID = row[0]
        exp = Exp.fromJsonFile(encodeID)
        json = exp.getExpJson()

        biosample = json["replicates"][0]["library"]["biosample"]
        try:
            organ = biosample["organ_slims"]
            if 1 == len(organ):
                organ = organ[0]
            elif len(organ) > 1:
                #print("multiple", organ)
                organ = organ[0]
        except:
            print("missing", encodeID, biosample["biosample_term_name"])
            organ = ""

        if biosample["biosample_term_name"] in lookup:
            organ = lookup[biosample["biosample_term_name"]]

        if not organ or "na" == organ:
            print("missing organ", "'" + biosample["biosample_term_name"] + "'")
            organ = ""  # biosample["biosample_term_name"]

        try:
            cellCompartment = json["replicates"][0]["library"]["biosample"]["subcellular_fraction_term_name"]
        except:
            #print(encodeID, "assuming cell compartment")
            cellCompartment = "cell"

        ageTitle = ''
        try:
            if 'mm10' == self.assembly:
                bs = exp.jsondata["replicates"][0]["library"]["biosample"]
                life_stage = bs.get("life_stage", "")
                age_units = bs.get("age_units", "")
                age = bs.get("age", "")
                toks = [x for x in [life_stage, age, age_units] if x and x != "unknown"]
                ageTitle = ''
                if toks:
                    ageTitle = '(' + ' ' .join(toks) + ')'
                #print(ageTitle)
        except:
            raise
            ageTitle = ''

        a = [exp.encodeID,
             exp.biosample_term_name,
             organ,
             cellCompartment,
             exp.target,
             exp.lab,
             exp.assay_term_name,
             exp.biosample_type,
             ageTitle]
        # print(a)
        outF.write('\t'.join(a) + '\n')

    def insertRNAs(self):
        tissueFixesFnp = os.path.join(os.path.dirname(__file__),
                                      "cellTypeFixesEncode.txt")
        printt("reading", tissueFixesFnp)
        with open(tissueFixesFnp) as f:
            rows = f.readlines()
        lookup = {}
        for idx, r in enumerate(rows):
            toks = r.rstrip().split(',')
            if len(toks) != 2:
                raise Exception("wrong number of tokens on line " + str(idx + 1) + ": "
                                + r + "found " + str(len(toks)))
            lookup[toks[0]] = toks[1].strip()

        printt("gettings datasets")
        self.curs.execute("select distinct(dataset) from r_expression_" + self.assembly)
        rows = self.curs.fetchall()
        printt("found", len(rows), "rows")

        printt("loading metadata")
        outF = StringIO.StringIO()
        for row in rows:
            self.processRow(row, outF, lookup)
        outF.seek(0)

        cols = ["encode_id", "cellType", "organ",
                "cellCompartment", "target", "lab",
                "assay_term_name", "biosample_type", "ageTitle"]

        tableName = "r_rnas_" + self.assembly
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        printt("inserted", self.curs.rowcount)

    def doIndex(self):
        tableName = "r_rnas_" + self.assembly
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

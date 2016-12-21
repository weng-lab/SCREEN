#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome
from exp import Exp
from utils import Utils
from metadataws import MetadataWS

def setupDB(cur, species):
    cur.execute("""
DROP TABLE IF EXISTS {tableName};

CREATE TABLE {tableName}
(id serial PRIMARY KEY,
encode_id text,
cellType text,
organ text,
cellCompartment text,
target text,
lab text,
assay_term_name text,
biosample_type text,
description text
    ) """.format(tableName = "r_rnas_" + species))

def insertRNAs(cur, species):
    tissueFixesFnp = os.path.join(os.path.dirname(__file__), "cellTypeFixesEncode.txt")
    with open(tissueFixesFnp) as f:
        rows = f.readlines()
    lookup = {}
    for idx, r in enumerate(rows):
        toks = r.rstrip().split(',')
        if len(toks) != 2:
            raise Exception("wrong number of tokens on line " + str(idx + 1) + ": "
                            + r + "found " + str(len(toks)))
        lookup[toks[0]] = toks[1].strip()

    cur.execute("select distinct(dataset) from r_expression_" + species)
    rows = cur.fetchall()
    print("found", len(rows), "rows")
    counter = 0
    for row in rows:
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
            print(biosample["biosample_term_name"])

        try:
            cellCompartment = json["replicates"][0]["library"]["biosample"]["subcellular_fraction_term_name"]
        except:
            #print(encodeID, "assuming cell compartment")
            cellCompartment = "cell"

        cur.execute("""
INSERT INTO {tableName}
        (encode_id, cellType, organ, cellCompartment, target, lab, assay_term_name, biosample_type, description)
VALUES (
%(encode_id)s,
%(cellType)s,
%(organ)s,
        %(cellCompartment)s,
%(target)s,
%(lab)s,
%(assay)s,
%(biosample_type)s,
%(desc)s
        )""".format(tableName = "r_rnas_" + species),
                    {"encode_id" : exp.encodeID,
                     "cellType" : exp.biosample_term_name,
                     "organ" : organ,
                     "cellCompartment" : cellCompartment,
                     "target" : exp.target,
                     "lab" : exp.lab,
                     "assay" : exp.assay_term_name,
                     "biosample_type" : exp.biosample_type,
                     "desc" : exp.description
                    })
        counter += 1
    print("inserted", counter, "RNA-seq for", species)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    for species in ["mouse", "human"]:
        DBCONN = db_connect(os.path.realpath(__file__), args.local)
        with getcursor(DBCONN, "02_init") as curs:
            setupDB(curs, species)
            insertRNAs(curs, species)

if __name__ == '__main__':
    main()

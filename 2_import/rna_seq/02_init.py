#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome
from exp import Exp
from utils import Utils, printt
from metadataws import MetadataWS

def setupDB(cur, assembly):
    tableName = "r_rnas_" + assembly
    printt("dropping and creating", tableName)

    cur.execute("""
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
description text
    ) """.format(tn = tableName))

def insertRNAs(cur, assembly):
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
    cur.execute("select distinct(dataset) from r_expression_" + assembly)
    rows = cur.fetchall()
    printt("found", len(rows), "rows")

    printt("loading metadata")
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

        tableName = "r_rnas_" + assembly
        cur.execute("""
INSERT INTO {tn}
(encode_id, cellType, organ, cellCompartment, target, lab, 
assay_term_name, biosample_type, description)
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
        )""".format(tn = tableName),
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
    printt("inserted", counter, "RNA-seq for", assembly)

def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    for assembly in ["mm10", "hg19"]:
        DBCONN = db_connect(os.path.realpath(__file__))
        with getcursor(DBCONN, "02_init") as curs:
            print('***********', assembly)
            setupDB(curs, assembly)
            insertRNAs(curs, assembly)

if __name__ == '__main__':
    main()

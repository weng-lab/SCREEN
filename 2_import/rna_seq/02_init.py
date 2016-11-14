#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from helpers_metadata import Exp
from utils import Utils
from metadataws import MetadataWS

def setupDB(cur, species):
    cur.execute("""
DROP TABLE IF EXISTS r_rnas;

CREATE TABLE r_rnas
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
) """)

def insertRNAs(cur, dataset):
    with open("missing2.txt") as f:
        rows = f.readlines()
    lookup = {}
    for r in rows:
        toks = r.rstrip().split('\t')
        print(toks)
        if len(toks) != 2:
            raise Exception("wrong number of tokens on line: " + r + "found " + str(len(toks)))
        lookup[toks[0]] = toks[1]
    
    cur.execute("""
select distinct(dataset) from r_expression""")
    counter = 0
    for row in cur.fetchall():
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
INSERT INTO r_rnas
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
)""", {"encode_id" : exp.encodeID,
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
    print("inserted", counter, "RNA-seq for", dataset.species)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    for dataset in [Datasets.all_human]:
        DBCONN = db_connect(os.path.realpath(__file__), args.local)
        with getcursor(DBCONN, "02_init") as curs:
            setupDB(curs, dataset.species)
            insertRNAs(curs, dataset)

if __name__ == '__main__':
    main()

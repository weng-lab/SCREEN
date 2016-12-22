#!/usr/bin/env python

from __future__ import print_function
import json
import sys
import os
import argparse
import string
from collections import namedtuple

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets
from get_tss import Genes
from exp import Exp
from db_utils import getcursor

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from constants import paths, chroms
from dbconnect import db_connect

Biosample = namedtuple("Biosample", "biosample_type biosample_term_name summary es_name tissue")

class BiosampleRow:
    # translate tissue name to tissue name
    lookupTissue = {}
    lookupTissue["hg19"] = {}
    lookupTissue["mm10"] = {"small intestine" : "intestine",
                            "large intestine" : "intestine",
                            "bone element" : "bone"}

    # translate biosample term name
    lookupBTN = {}
    lookupBTN["hg19"] = {}
    lookupBTN["mm10"] = {"limb" : "limb",
                         "intestine" : "intestine",
                         "adipocyte" : "adipose",
                         "brown adipose tissue" : "adipose",
                         "embryo" : "embryonic structure",
                         "embryonic facial prominence" : "embryonic structure",
                         "neural tube" : "brain",
                         "brain" : "brain",
                         "cerebellum" : "brain",
                         "3T3-L1" : "adipose",
                         "acute myeloid leukemia" : "blood",
                         "CH12.LX" : "blood",
                         "erythroblast" : "blood",
                         "fat pad" : "adipose",
                         "forebrain" : "brain",
                         "heart" : "heart",
                         "gonadal fat pad" : "adipose",
                         "forelimb bud" : "limb",
                         "midbrain" : "brain",
                         "Muller cell" : "eye",
                         "testis" : "gonad",
                         "thymus" : "thymus",
                         "telencephalon" : "brain",
                         "stomach" : "stomach",
                         "spleen" : "spleen",
                         "skeletal muscle tissue" : "muscle",
                         "retina" : "eye",
                         "placenta" : "placenta",
                         "hindbrain" : "brain",
                         "hindlimb bud" : "limb",
                         "kidney" : "kidney",
                         "liver" : "liver",
                         "lung" : "lung",
                         "MEL cell line" : "blood",
                         "olfactory bulb" : "brain",
                         "WW6" : "ESC",
                         "MEL-GATA-1-ER": "blood",
                         "embryoid body": "ESC",
                         "E14TG2a.4": "ESC",
                         "Patski": "kidney",
                         "cortical plate": "brain",
                         "embryonic fibroblast": "embryonic structure",
                         "mesoderm": "embryonic structure",
                         "ES-E14": "embryonic structure",
                         "fibroblast": "connective",
                         "ZHBTc4-mESC": "ESC",
                         "MN1": "brain",
                         "ES-Bruce4": "ESC"
        }

    def __init__(self, expID, assembly):
        self.expID = expID
        self.assembly = assembly

    def _translateTissue(self, exp):
        t = exp.jsondata["organ_slims"]
        if t:
            t = t[0]
        else:
            t = ""
        lookup = BiosampleRow.lookupTissue[self.assembly]
        if t in lookup:
            return lookup[t]
        ct = exp.biosample_term_name
        lookup = BiosampleRow.lookupBTN[self.assembly]
        if ct in lookup:
            return lookup[ct]
        if ct.endswith("erythroid progenitor cells"):
            return "blood"

        "select  distinct tissue from biosamples_mm10 where tissue = ''"
        return ""

    def parse(self):
        exp = Exp.fromJsonFile(self.expID)
        ct = exp.biosample_term_name

        tissue = self._translateTissue(exp)
        summary = exp.jsondata.get("biosample_summary", ct)

        tbl = string.maketrans(' ./', '__-')
        es_name = str(summary).translate(tbl, '()').replace('__', '_')
        return Biosample(exp.biosample_type,
                         exp.biosample_term_name,
                         summary,
                         es_name,
                         tissue)

class BiosamplesBase(object):
    def __init__(self, assembly, curs):
        self.assembly = assembly
        self.curs = curs
        self.tableName = "biosamples_" + assembly

class BiosamplesMaker(BiosamplesBase):
    def __init__(self, assembly, curs):
        BiosamplesBase.__init__(self, assembly, curs)

    def run(self):
        rows = self._load()
        for r in rows:
            print('; '.join(r))
        self._setupDb()
        for r in rows:
            self._insertDb(r)

    def _load(self):
        d = os.path.join(os.path.dirname(__file__), "../counts/")

        rows = set()
        for fn in os.listdir(d):
            if not fn.startswith(self.assembly) or "bigwig" not in fn:
                continue
            fnp = os.path.join(d, fn)
            print(fnp)
            with open(fnp) as f:
                data = [line.rstrip().split('\t') for line in f.readlines()[1:]]
            expIDs = list(set([x[0] for x in data]))

            for expID in expIDs:
                row = BiosampleRow(expID, self.assembly).parse()
                rows.add(row)
        return rows

    def _setupDb(self):
        print("\tdropping and creating", self.tableName)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tableName};
        CREATE TABLE {tableName}
        (id serial PRIMARY KEY,
        biosample_type text NOT NULL,
        biosample_term_name text NOT NULL,
        summary text NOT NULL,
        es_name text NOT NULL,
        tissue text
        ) """.format(tableName = self.tableName))

    def _insertDb(self, r):
        self.curs.execute("""
        INSERT INTO {tableName}
        (biosample_type, biosample_term_name, summary, es_name, tissue)
        VALUES (
        %(biosample_type)s,
        %(biosample_term_name)s,
        %(summary)s,
        %(es_name)s,
        %(tissue)s)""".format(tableName = self.tableName),
                          {"biosample_type" : r.biosample_type,
                           "biosample_term_name" : r.biosample_term_name,
                           "summary" : r.summary,
                           "es_name" : r.es_name,
                           "tissue" : r.tissue
                          })

class Biosamples(BiosamplesBase):
    def __init__(self, assembly, curs):
        BiosamplesBase.__init__(self, assembly, curs)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--version', type=int, default=7)
    parser.add_argument('--assembly', type=str, default="hg19")
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    with getcursor(DBCONN, "biosample") as curs:
        for assembly in ["mm10", "hg19"]:
            b = BiosamplesMaker(assembly, curs)
            b.run()
    return 0

if __name__ == "__main__":
    sys.exit(main())

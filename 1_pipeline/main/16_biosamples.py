#!/usr/bin/env python

from __future__ import print_function
import json
import sys
import os
import argparse
import string
from collections import namedtuple

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets
from get_tss import Genes
from exp import Exp
from db_utils import getcursor

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms
from dbconnect import db_connect

Biosample = namedtuple("Biosample", "assembly biosample_type biosample_term_name summary es_name tissue")

class BiosampleRow:
    @staticmethod
    def parse(assembly, expID):
        exp = Exp.fromJsonFile(expID)
        ct = exp.biosample_term_name
        tissue = exp.jsondata["organ_slims"]
        if tissue:
            tissue = tissue[0]
        else:
            tissue = ""
        summary = exp.jsondata.get("biosample_summary", "")
        if not summary:
            summary = ct

        tbl = string.maketrans(' ./', '__-')
        es_name = str(summary).translate(tbl, '()').replace('__', '_')
        return Biosample(assembly, exp.biosample_type,
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
            
    def _load(self):
        d = os.path.join(os.path.dirname(__file__), "../../counts/")

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
                row = BiosampleRow.parse(self.assembly, expID)
                rows.add(row)
        return rows
        
    def _setupDb(self):
        print("\tdropping and creating", self.tableName)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tableName};
        CREATE TABLE {tableName}
        (id serial PRIMARY KEY,
        biosample_term_name text,
        biosample_summary text,
        es_name text,
        tissue text,
        biosample_type text
        ) """.format(tableName = self.tableName))

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

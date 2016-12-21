#!/usr/bin/env python

from __future__ import print_function
import json
import sys
import os
import argparse
import string

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from files_and_paths import Dirs, Tools, Genome, Datasets
from get_tss import Genes
from exp import Exp

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths, chroms

class Biosamples:
    def __init__(self, assembly, curs):
        self.assembly = assembly
        self.curs = curs
        self.tableName = "biosamples_" + assembly

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
        
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=32)
    parser.add_argument('--version', type=int, default=7)
    parser.add_argument('--assembly', type=str, default="hg19")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    d = os.path.join(os.path.dirname(__file__), "../../counts/")

    tbl = string.maketrans(' ./', '__-')
    
    for assembly in ["mm10", "hg19"]:
        rows = set()
        for fn in os.listdir(d):
            if not fn.startswith(assembly) or "bigwig" not in fn:
                continue
            fnp = os.path.join(d, fn)
            print(fnp)
            with open(fnp) as f:
                data = [line.rstrip().split('\t') for line in f.readlines()[1:]]
            expIDs = list(set([x[0] for x in data]))

            for expID in expIDs:
                exp = Exp.fromJsonFile(expID)
                ct = exp.biosample_term_name
                organ = exp.jsondata["organ_slims"]
                if organ:
                    organ = organ[0]
                else:
                    organ = ""
                summary = exp.jsondata.get("biosample_summary", "")
                if not summary:
                    summary = ct
                es_name = str(summary).translate(tbl, '()').replace('__', '_')
                e = (assembly, exp.biosample_type,
                     exp.biosample_term_name,
                     summary,
                     es_name,
                     organ)
                rows.add(e)
        for r in rows:
            print('; '.join(r))
    return 0

if __name__ == "__main__":
    sys.exit(main())

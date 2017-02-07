#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs

chromlimit = {"hg19": 22, "mm10": 19}

class SetupAutocomplete:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly

    def run(self):
        names = []
        for chrom in ["chr%d" % d for d in range(1, chromlimit[self.assembly] + 1)] + ["chrX", "chrY"]:
            self.curs.execute("SELECT name FROM {assembly}_snps_{chrom}".format(chrom=chrom, assembly=self.assembly))
            r = self.curs.fetchall()
            if r:
                for row in r:
                    names.append(row[0])
        self.curs.execute("SELECT approved_symbol, ensemblid, info FROM {assembly}_gene_info".format(assembly=self.assembly))
        r = self.curs.fetchall()
        keys = ["UniProt_ID", "RefSeq_ID", "Vega_ID", "UCSC_ID"]
        if r:
            for row in r:
                names.append(row[0])
                names.append(row[1])
                print(row[2])
                if row[2]:
                    for key in keys:
                        if key in row[2]:
                            names.append(row[2][key])
                        if "synonyms" in row[2]:
                            names += row[2]["synonyms"]
        d = os.path.join("/project/umw_zhiping_weng/0_metadata/encyclopedia/",
                         "Version-4", "ver9", self.assembly, "raw")
        fnp = os.path.join(d, "autocomplete_dictionary.txt")
        with open(fnp, "wb") as o:
            o.write("\n".join(names))
        with open(fnp, "r") as f:
            self.curs.execute("DROP TABLE IF EXISTS {assembly}_autocomplete".format(assembly=self.assembly))
            self.curs.execute("CREATE TABLE {assembly}_autocomplete (id serial PRIMARY KEY, name VARCHAR(256))".format(assembly=self.assembly))
            self.curs.copy_from(f, "%s_autocomplete" % self.assembly, "\t", columns=["name"])
                
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()
    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    for assembly in ["mm10", "hg19"]:
        with getcursor(DBCONN, "main") as curs:
            ss = SetupAutocomplete(curs, assembly)
            ss.run()

if __name__ == '__main__':
    main()

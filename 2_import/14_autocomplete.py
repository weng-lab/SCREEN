#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor
from files_and_paths import Dirs

chromlimit = {"hg19": 22, "mm10": 19}

class SetupAutocomplete:
    def __init__(self, curs, assembly, save):
        self.curs = curs
        self.assembly = assembly
        self.save = save

    def run(self):
        printt("loading snps...")
        names = []
        for chrom in ["chr%d" % d for d in range(1, chromlimit[self.assembly] + 1)] + ["chrX", "chrY"]:
            self.curs.execute("""
SELECT name, start, stop FROM {assembly}_snps_{chrom}
""".format(chrom=chrom, assembly=self.assembly))
            r = self.curs.fetchall()
            for row in r:
                names.append(row[0] + "\t%s\t%d\t%d" % (chrom, row[1], row[2]))

        printt("loading gene info...")
        self.curs.execute("""
SELECT approved_symbol, ensemblid, info, chrom, start, stop 
FROM {assembly}_gene_info
""".format(assembly=self.assembly))
        r = self.curs.fetchall()
        keys = ["UniProt_ID", "RefSeq_ID", "Vega_ID", "UCSC_ID", "HGNC_ID", "approved_name"]
        for row in r:
            c = "%s\t%d\t%d" % (row[3], row[4], row[5])
            names.append(row[0] + "\t" + c)
            names.append(row[1] + "\t" + c)
            if row[2]:
                for key in keys:
                    if key in row[2]:
                        names.append(row[2][key] + "\t" + c)
                    if "synonyms" in row[2]:
                        names += [x.strip() + "\t" + c for x in row[2]["synonyms"]]
                    if "previous_symbols" in row[2]:
                        names += [x.strip() + "\t" + c for x in row[2]["previous_symbols"]]

        outF = StringIO.StringIO()
        outF.write("\n".join(names))
        outF.seek(0)

        if self.save:
            d = os.path.join("/project/umw_zhiping_weng/0_metadata/encyclopedia/",
                             "Version-4", "ver9", self.assembly, "raw")
            fnp = os.path.join(d, "autocomplete_dictionary.txt")
            with open(fnp, "wb") as o:
                o.write("\n".join(names))
            printt("wrote", fnp)
            
        printt("found", len(names), "items")

        printt("inserting into table...")
        self.curs.execute("""
DROP TABLE IF EXISTS {assembly}_autocomplete;
CREATE TABLE {assembly}_autocomplete 
(id serial PRIMARY KEY, 
name TEXT, 
chrom TEXT, 
start INT, 
stop INT)
""".format(assembly=self.assembly))

        self.curs.copy_from(outF, "%s_autocomplete" % self.assembly,
                            "\t", columns=["name", "chrom", "start", "stop"])

        printt("indexing table...")
        self.curs.execute("""
CREATE INDEX {assembly}_autocomplete_index ON {assembly}_autocomplete 
USING btree (name text_pattern_ops)
""".format(assembly=self.assembly))

        # will need to run as psql postgres user:
        # \c regElmViz; CREATE EXTENSION pg_trgm;
        self.curs.execute("""
CREATE INDEX {assembly}_fulltext_index ON {assembly}_autocomplete 
USING gin (name gin_trgm_ops)
""".format(assembly=self.assembly))
                
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--save', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()
    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    for assembly in ["mm10", "hg19"]:
        with getcursor(DBCONN, "main") as curs:
            ss = SetupAutocomplete(curs, assembly, args.save)
            ss.run()

if __name__ == '__main__':
    main()

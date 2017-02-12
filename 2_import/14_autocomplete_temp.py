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

    def test(self, q):
        self.curs.execute("SELECT approved_symbol FROM {assembly}_gene_info WHERE approved_symbol = '{q}'".format(assembly=self.assembly, q=q))
        print(self.curs.fetchall())

    def run(self):
        names = []
        for chrom in ["chr%d" % d for d in range(1, chromlimit[self.assembly] + 1)] + ["chrX", "chrY"]:
            self.curs.execute("SELECT name, start, stop FROM {assembly}_snps_{chrom}".format(chrom=chrom, assembly=self.assembly))
            r = self.curs.fetchall()
            if r:
                for row in r:
                    names.append(row[0] + "\t%s\t%d\t%d\t\t0\t0\t%s" % (chrom, row[1], row[2], row[0]))
        found = {}
        self.curs.execute("""SELECT approved_symbol, ensemblid, info, g.chrom, g.start, g.stop, t.chrom, t.start, t.stop FROM {assembly}_gene_info AS g LEFT JOIN {assembly}_tss_info AS t
                             ON t.ensemblid_ver = g.ensemblid_ver""".format(assembly=self.assembly))
        r = self.curs.fetchall()
        keys = ["UniProt_ID", "RefSeq_ID", "Vega_ID", "UCSC_ID", "HGNC_ID", "approved_name"]
        if r:
            for _row in r:
                row = list(_row)
                if not row[6]:
                    row[6] = row[3]
                    row[7] = row[4]
                    row[8] = row[5]
                c = "%s\t%d\t%d\t%s\t%d\t%d" % (row[3], row[4], row[5], row[6], row[7], row[8])
                names.append(row[0].lower() + "\t" + c + "\t" + row[0])
                names.append(row[1].lower() + "\t" + c + "\t" + row[1])
                if row[2]:
                    for key in keys:
                        if key in row[2]:
                            names.append(row[2][key].lower() + "\t" + c + "\t" + row[2][key])
                        if "synonyms" in row[2]:
                            names += [x.strip().lower() + "\t" + c + "\t" + x for x in row[2]["synonyms"]]
                        if "previous_symbols" in row[2]:
                            names += [x.strip().lower() + "\t" + c + "\t" + x for x in row[2]["previous_symbols"]]
        d = os.path.join("/project/umw_zhiping_weng/0_metadata/encyclopedia/",
                         "Version-4", "ver9", self.assembly, "raw")
        fnp = os.path.join(d, "autocomplete_dictionary.txt")
        with open(fnp, "wb") as o:
            o.write("\n".join(names))
        print("wrote %d items to %s" % (len(names), fnp))
        with open(fnp, "r") as f:
            print("inserting into table...")
            self.curs.execute("DROP TABLE IF EXISTS {assembly}_autocomplete".format(assembly=self.assembly))
            self.curs.execute("CREATE TABLE {assembly}_autocomplete (id serial PRIMARY KEY, name TEXT, chrom TEXT, start INT, stop INT, altchrom TEXT, altstart INT, altstop INT, oname TEXT)".format(assembly=self.assembly))
            self.curs.copy_from(f, "%s_autocomplete" % self.assembly, "\t", columns=["name", "chrom", "start", "stop", "altchrom", "altstart", "altstop", "oname"])
        print("indexing table...")
        self.curs.execute("CREATE INDEX {assembly}_autocomplete_index ON {assembly}_autocomplete USING btree (name text_pattern_ops)".format(assembly=self.assembly))
        self.curs.execute("CREATE INDEX {assembly}_fulltext_index ON {assembly}_autocomplete USING gin (name gin_trgm_ops)".format(assembly=self.assembly))
                
def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--testgene', type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()
    DBCONN = db_connect(os.path.realpath(__file__), args.local)
    for assembly in ["mm10", "hg19"]:
        with getcursor(DBCONN, "main") as curs:
            ss = SetupAutocomplete(curs, assembly)
            if args.testgene != "":
                ss.test(args.testgene)
            else:
                ss.run()

if __name__ == '__main__':
    main()

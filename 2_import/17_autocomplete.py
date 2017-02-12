#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, StringIO, gzip

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor
from files_and_paths import Dirs

class SetupAutocomplete:
    def __init__(self, curs, assembly, save):
        self.curs = curs
        self.assembly = assembly
        self.save = save
        self.tableName = self.assembly + "_autocomplete"

    def test(self, q):
        self.curs.execute("""
SELECT approved_symbol
FROM {assembly}_gene_info
WHERE approved_symbol = %s
""".format(assembly=self.assembly), (q,) )
        print(self.curs.fetchall())

    def _snps(self):
        printt("loading snps...")
        names = []
        for chrom in chroms[self.assembly]:
            self.curs.execute("""
SELECT name, start, stop FROM {assembly}_snps_{chrom}
""".format(chrom=chrom, assembly=self.assembly))
            r = self.curs.fetchall()
            for row in r:
                names.append(row[0] + "\t%s\t%d\t%d\t%s\t%d\t%d\t%s" % (chrom, row[1], row[2], chrom, row[1], row[2], row[0]))
        return names

    def _genes(self):
        printt("loading gene info...")
        self.curs.execute("""
SELECT approved_symbol, ensemblid, info,
g.chrom, g.start, g.stop,
t.chrom, t.start, t.stop
FROM {assembly}_gene_info AS g
LEFT JOIN {assembly}_tss_info AS t
ON t.ensemblid_ver = g.ensemblid_ver""".format(assembly=self.assembly))
        rows = self.curs.fetchall()

        names = []
        for row in rows:
            row = list(row)
            if not row[6]:
                _c = row[3:6]
            else:
                _c = row[6:9]
            c = "%s\t%d\t%d\t%s\t%d\t%d" % (row[3], row[4], row[5], _c[0], _c[1], _c[2])
            names.append(row[0].lower() + "\t" + c + "\t" + row[0])
            names.append(row[1].lower() + "\t" + c + "\t" + row[1])
            if row[2]:
                for k, v in row[2].iteritems():
                    if '|' in v:
                        for e in v.split('|'):
                            if e:
                                names.append(e.lower() + "\t" + c + "\t" + v)
                    else:
                        names.append(v.lower() + "\t" + c + "\t" + v)
        return names

    def _save(self, names):
        if self.save:
            fnp = paths.path(self.assembly, "extras",
                             "autocomplete_dictionary.txt")
            with open(fnp, "wb") as o:
                o.write("\n".join(names))
            printt("wrote", fnp)

    def _db(self, names):
        outF = StringIO.StringIO()
        outF.write("\n".join(names))
        outF.seek(0)

        printt("inserting into table...")
        self.curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}
(id serial PRIMARY KEY,
name TEXT,
chrom TEXT,
start INT,
stop INT,
altchrom TEXT,
altstart INT,
altstop INT,
oname TEXT)
""".format(tn = self.tableName))

        cols = ["name", "chrom", "start", "stop",
                "altchrom", "altstart", "altstop", "oname"]
        self.curs.copy_from(outF, self.tableName, "\t",
                            columns=cols)

    def _index(self):
        printt("indexing table...")
        self.curs.execute("""
CREATE INDEX {tn}_index ON {tn}
USING btree (name text_pattern_ops)
""".format(tn = self.tableName))

        # will need to run as psql postgres user:
        # \c regElmViz; CREATE EXTENSION pg_trgm;
        self.curs.execute("""
CREATE INDEX {tn}_fulltext_index ON {tn}
USING gin (name gin_trgm_ops)
""".format(tn = self.tableName))

    def run(self):
        names = self._genes() + self._snps()
        printt("found", len(names), "items")

        self._save(names)
        self._db(names)
        self._index()

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
            print('***********', assembly)
            ss = SetupAutocomplete(curs, assembly, args.save)
            ss.run()

if __name__ == '__main__':
    main()

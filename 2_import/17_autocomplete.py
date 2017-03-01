#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, gzip
import StringIO

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
            SELECT name, start, stop, id FROM {assembly}_snps_{chrom}
""".format(chrom=chrom, assembly=self.assembly))
            r = self.curs.fetchall()
            for row in r:
                names.append('\t'.join([row[0],
                                        chrom, str(row[1]), str(row[2]),
                                        chrom, str(row[1]), str(row[2]),
                                        row[0], "2", str(row[3])]))
        return names

    def _genes(self):
        printt("loading gene info...")
        self.curs.execute("""
SELECT approved_symbol, ensemblid, info,
g.chrom, g.start, g.stop,
t.chrom, t.start, t.stop, g.id
FROM {assembly}_gene_info AS g
LEFT JOIN {assembly}_tss_info AS t
ON t.ensemblid_ver = g.ensemblid_ver""".format(assembly=self.assembly))
        rows = self.curs.fetchall()

        names = []
        for row in rows:
            row = list(row)
            if not row[6]: # no tss chrom
                _c = row[3:6] # gene chrom, start, end
            else:
                _c = row[6:9] # tss chrom, start, end
            c = '\t'.join([row[3], str(row[4]), str(row[5]), _c[0], str(_c[1]), str(_c[2])])
            names.append('\t'.join([row[0].lower(), c, row[0], "1", str(row[9])]))
            names.append('\t'.join([row[1].lower(), c, row[1], "1", str(row[9])]))

            if row[2]:
                for k, v in row[2].iteritems():
                    if '|' in v:
                        for e in v.split('|'):
                            if e:
                                names.append('\t'.join([e.lower(), c, e, "1", str(row[9])]))
                    else:
                        names.append('\t'.join([v.lower(), c, v, "1", str(row[9])]))
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

        printt("inserting into", self.tableName)
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
        oname TEXT,
        handler INT,
        pointer INT)
""".format(tn = self.tableName))

        cols = ["name", "chrom", "start", "stop",
                "altchrom", "altstart", "altstop", "oname", "handler", "pointer"]
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
    parser.add_argument('--save', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()
    DBCONN = db_connect(os.path.realpath(__file__))
    for assembly in ["mm10", "hg19"]:
        with getcursor(DBCONN, "main") as curs:
            print('***********', assembly)
            ss = SetupAutocomplete(curs, assembly, args.save)
            ss.run()

if __name__ == '__main__':
    main()

#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, argparse, gzip
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt
from db_utils import getcursor, makeIndex, makeIndexGinTrgmOps, makeIndexTextPatternOps
from files_and_paths import Dirs

class SetupAutocomplete:
    def __init__(self, curs, assembly, tableName, doAddSnps):
        self.curs = curs
        self.assembly = assembly
        self.tableName = tableName
        self.doAddSnps = doAddSnps

    def run(self):
        self._setupDb()

        if self.doAddSnps:
            self._snps()

        names = self._genes()
        printt("found", "{:,}".format(len(names)), "items")

        self._db(names)
        self.index()

    def _setupDb(self):
        printt("drop and create", self.tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tn};
CREATE TABLE {tn}
(id serial PRIMARY KEY,
name TEXT,
chrom TEXT,
start integer,
stop integer,
altchrom TEXT,
altstart integer,
altstop integer,
oname TEXT,
handler integer,
pointer integer)
""".format(tn = self.tableName))

    def test(self, q):
        self.curs.execute("""
SELECT approved_symbol
FROM {assembly}_gene_info
WHERE approved_symbol = %s
""".format(assembly=self.assembly), (q,) )
        print(self.curs.fetchall())

    def _snps(self):
        printt("inserting snps...")
        names = []
        self.curs.execute("""
        INSERT INTO {tn}
        (name,
        chrom, start, stop,
        altchrom, altstart, altstop,
        oname, handler, pointer)
        SELECT snp,
        chrom, start, stop,
        chrom, start, stop,
        snp, 2, id
        FROM {assembly}_snps
        """.format(tn = self.tableName, assembly = self.assembly))
        printt("\tok", "{:,}".format(self.curs.rowcount))

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
        return list(set(names))

    def _db(self, names):
        outF = StringIO.StringIO()
        outF.write("\n".join(names))
        outF.seek(0)

        printt("inserting into", self.tableName)

        cols = ["name", "chrom", "start", "stop",
                "altchrom", "altstart", "altstop", "oname", "handler", "pointer"]
        self.curs.copy_from(outF, self.tableName, "\t",
                            columns=cols)
        printt("\tok", "{:,}".format(self.curs.rowcount))

    def index(self):
        makeIndexTextPatternOps(self.curs, self.tableName, ["name"])
        makeIndexGinTrgmOps(self.curs, self.tableName, ["name"])
        makeIndex(self.curs, self.tableName, ["oname"])

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        with getcursor(DBCONN, "main") as curs:
            print('***********', assembly)
            ss = SetupAutocomplete(curs, assembly, assembly + "_autocomplete", True)
            if args.index:
                ss.index()
            else:
                ss.run()

            ss = SetupAutocomplete(curs, assembly, assembly + "_gene_search", False)
            if args.index:
                ss.index()
            else:
                ss.run()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--index', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    run(args, DBCONN)
        
if __name__ == '__main__':
    main()

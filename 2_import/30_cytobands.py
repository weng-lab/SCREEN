#!/usr/bin/env python3



import os
import sys
import gzip
import argparse
import json

sys.path.append(os.path.join(os.path.dirname(__file__), '../utils'))
from utils import Utils, eprint, AddPath, printt

AddPath(__file__, '../common/')
from db_utils import getcursor
from dbconnect import db_connect
from constants import paths
from config import Config


class Cytoband:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = self.assembly + "_cytobands"

    def run(self):
        self._load()
        self._import()
        self.show()

    def _load(self):
        fnp = paths.cytobands[self.assembly]

        self.bands = {}
        with gzip.open(fnp, "r") as f:
            for line in f:
                p = line.strip().split("\t")
                if p[0] not in self.bands:
                    self.bands[p[0]] = []
                if "gpos" in p[4]:
                    self.bands[p[0]].append({"start": int(p[1]),
                                             "end": int(p[2]),
                                             "feature": p[4],
                                             "color": float(p[4].replace("gpos", "")) / 100.0})
                else:
                    self.bands[p[0]].append({"start": int(p[1]),
                                             "end": int(p[2]),
                                             "feature": p[4]})

    def _import(self):
        printt('***********', "drop and create", self.tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
assembly text,
cytobands jsonb);""".format(tableName=self.tableName))

        printt('***********', "import cytobands")
        self.curs.execute("""
        INSERT INTO {tableName} 
        (assembly, cytobands)
        VALUES (%s, %s)
        """.format(tableName=self.tableName),
            (self.assembly,
             json.dumps(self.bands)))
        print("updated", self.tableName)

    def show(self):
        for chrom, bands in self.bands.items():
            print(chrom, len(bands), bands[0])
        print()
        print(json.dumps(self.bands, sort_keys=True, indent=4))


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "30_cytobands") as curs:
            c = Cytoband(curs, assembly)
            c.run()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)

    return 0


if __name__ == "__main__":
    sys.exit(main())

#!/usr/bin/env python

from __future__ import print_function
import os
import sys
import json
import psycopg2
import re
import argparse
import gzip
import tempfile

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from get_tss import Genes
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, printWroteNumLines, printt


class GWASmaf:
    def __init__(self, curs, fnp, tn):
        self.curs = curs
        self.tableName = tn
        self.origFnp = fnp

    def run(self):
        tf = tempfile.NamedTemporaryFile(delete=False)
        fnp = tf.name

        self._process(fnp)
        self._import(fnp)
        
        os.remove(fnp)

    def _process(self, fnp):
        with open(self.origFnp, 'r') as f:
            with open(fnp, 'w') as o:
                for line in f:
                    line = line.strip().split('\t')
                    if ';' in line[4]:
                        for snpid in line[4].split(';'):
                            p = [line[0], line[1], line[2], snpid, line[5], line[6], line[7]]
                            o.write('\t'.join(p) + '\n')
                    else:
                        p = [line[0], line[1], line[2], line[4], line[5], line[6], line[7]]
                        o.write('\t'.join(p) + '\n')

    def _import(self, fnp):
        printt("dropping and creating", self.tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
        chr text,
        startpos INT,
        stoppos INT,
        snp text,
        refallele text,
        altallele text,
        frequency text
);
""".format(tableName = self.tableName))

        printt("importing", fnp)
        with open(fnp) as f:
            cols = ["chr", "startpos", "stoppos", "snp", "refallele", "altallele", "frequency"]
            self.curs.copy_from(f, self.tableName, '\t', columns=cols)
        printt("imported", self.curs.rowcount)

        makeIndex(self.curs, self.tableName, ["snp"])


def parse_args():
    parser = argparse.ArgumentParser()
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    
    with getcursor(DBCONN, "04_cellTypeInfo") as curs:
        fnp = "/data/zusers/moorej3/haploreg_v4.0.MAF.bed"
        tn = "eur_maf"
        g = GWASmaf(curs, fnp, tn)
        g.run()

    return 0


if __name__ == '__main__':
    main()

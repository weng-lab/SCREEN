#!/usr/bin/env python3



import os
import sys
import gzip
import argparse
import json
import re
import io

sys.path.append(os.path.join(os.path.dirname(__file__), '../utils'))
from utils import Utils, eprint, AddPath, printt

AddPath(__file__, '../common/')
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange
from dbconnect import db_connect
from constants import paths
from config import Config


class Genes:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.tableName = self.assembly + "_gene_details"

    def run(self):
        self._import()
        self._doIndex()

    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["startpos", "endpos", "feature", "transcript_id", "gene_id"])

    def _import(self):
        fnp, ftype = paths.gene_files_path[self.assembly]
        printt("parsing", fnp)
        with gzip.open(fnp, 'r') as f:
            lines = f.readlines()
        outRows = []
        transcript_id = ''
        transcript_id_value = ''
        for line in lines:
            if not line.startswith("#"):
                line = line.rstrip()
                values = line.split('\t')
                start = int(values[3])
                end = int(values[4])
                att = values[8].split(';')
                attid = att[0].split('=')
                attributedict = {}
                exon_number_value = 0
                parent_value = ''
                gene_id = ''
                transcript_id = ''
                for v in att:
                    atid = v.split('=')
                    attributedict.update({atid[0]: atid[1]})
                    if atid[0] == 'transcript_id':
                        transcript_id = atid[0]
                        transcript_id_value = atid[1]
                    if atid[0] == 'exon_number':
                        exon_number_value = atid[1]
                    if atid[0] == 'Parent':
                        parent_value = atid[1]
                    if atid[0] == 'gene_id':
                        gene_id = atid[1]
                outRows.append('\t'.join([
                    str(values[0]),
                    str(values[3]),
                    str(values[4]),
                    str(values[2]),
                    str(exon_number_value),
                    str(values[6]),
                    str(parent_value),
                    str(gene_id),
                    str(transcript_id_value)
                ]))
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
seqname CHAR(10),
startpos integer,
endpos integer,
feature VARCHAR(100),
exon_number integer,
strand CHAR(5),
parent VARCHAR(50),
gene_id VARCHAR(50),
transcript_id VARCHAR(50));""".format(tableName=self.tableName))
        cols = [
            'seqname',
            'startpos',
            'endpos',
            'feature',
            'exon_number',
            'strand',
            'parent',
            'gene_id',
            'transcript_id'
        ]
        outF = io.StringIO()
        for r in outRows:
            outF.write(r + '\n')
        outF.seek(0)
        self.curs.copy_from(outF, self.tableName, '\t', columns=cols)
        printt('updated', self.tableName)


def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "35_genes_Details") as curs:
            c = Genes(curs, assembly)
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

#!/usr/bin/env python

import os
import sys
import argparse
from oauth2client import tools

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from db_utils import getcursor
from utils import AddPath

AddPath(__file__, '../common/')
from dbconnect import db_connect
from postgres_wrapper import PostgresWrapper
from constants import helptext

AddPath(__file__, "../googleapi")
from helptext import GoogleDocs

class DB:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN

    def recreate_tables(self):
        with getcursor(self.DBCONN, "DB::recreate_tables") as curs:
            curs.execute("""
DROP TABLE IF EXISTS helpkeys;
CREATE TABLE helpkeys
( id serial PRIMARY KEY,
key text,
title text,
summary text,
link text
)""")

    def insert_value(self, key, summary, title, link = ""):
        with getcursor(self.DBCONN, "DB::insert_totals") as curs:
            curs.execute("""
INSERT INTO helpkeys (key, title, summary, link)
VALUES (%s, %s, %s, %s)
""", (key, summary, title, link))

def parseargs():
    parser = argparse.ArgumentParser(parents = [tools.argparser])
    return parser.parse_args()

keymap = {"Activity Heatmap": "main_rank_heatmap",
          "TSS Start": "tss_dist",
          "Comparison Venn": "comparison_venn",
          "Comparison Heatmap": "comparison_heatmap",
          "Gene Expression": "gene_expression_barplot",
          "Cell Type Tree": "celltype_tree",
          "Cell Type Facet": "celltype_facet",
          "Z-score Facet": "zscore_facet",
          "Coordinate Facet": "coordinate_facet",
          "H3K4me3 Z-scores": "h3k4me3z",
          "H3K27ac Z-scores": "h3k27acz",
          "CTCF Z-scores": "ctcfz",
          "DNase Z-scores": "dnasez",
          "Intersecting transcription factors": "itfs",
          "Intersecting histone marks": "ihms",
          "Nearby genes": "nearbygenes",
          "Nearby cREs": "nearbycres",
          "Nearby SNPs": "nearbysnps",
          "Genes Within TAD": "geneswithintad",
          "cREs Within TAD": "creswithintad",
          "GWAS Studies Facet": "gwasstudies",
          "GWAS Cell Types Facet": "gwascelltypes",
          "GWAS Results Table": "gwasresults",
          "DE cRE Table": "decres",
          "DE Gene Table": "degenetable",
          "DifferentialGeneMouse" : "DifferentialGeneMouse",
          "CellTypeAgnosticClassification" : "CellTypeAgnosticClassification",
          "CellTypeSpecifiedClassification" : "CellTypeSpecifiedClassification"}

def main():
    args = parseargs()
    inserted = 0

    # connect to DB
    DBCONN = db_connect(os.path.realpath(__file__))
    db = DB(DBCONN)

    # download GoogleDoc
    _help_text = GoogleDocs(args).getcontents(helptext.docid).split("\n")

    # only reset DB if valid helptext was downloaded
    if len(_help_text) == 0:
        print("no help text could be downloaded; please check GoogleDoc contents at https://docs.google.com/document/d/%s" % helptext.docid)
        return 1
    db.recreate_tables()

    """
      " load from the cached Google Doc and parse
      " file format is:
      "
      " @key
      " # comment
      " %title
      " help_text
    """
    key = None
    help_text = ""
    title = ""
    for line in _help_text:
        if line.startswith('@'):
            if key and help_text and key in keymap:
                db.insert_value(keymap[key], key if not title else title, help_text.strip())
                inserted += 1
            key = line.strip()[1:]
            help_text = ""
            title = ""
        elif line.startswith("%"):
            title = line.replace("%", "").strip()
        elif not line.startswith("#"):
            help_text += line.strip() + "\n"
    if key and help_text and key in keymap:
        db.insert_value(keymap[key], key if not title else title, help_text.strip())
        inserted += 1

    print("inserted %d item%s" % (inserted, "s" if inserted != 1 else ""))
    return 0

if __name__ == "__main__":
    sys.exit(main())

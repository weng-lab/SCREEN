#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse, StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import chroms, chrom_lengths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from exp import Exp
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils

class DetermineTissue:
    # translate tissue name to tissue name
    lookupTissue = {}
    lookupTissue["hg19"] = {}
    lookupTissue["mm10"] = {"small intestine" : "intestine",
                            "large intestine" : "intestine",
                            "bone element" : "bone"}

    # translate biosample term name
    lookupBTN = {}
    fnp = os.path.join(os.path.dirname(__file__),
                       "../cellTypeToTissue.hg19.json.new")
    lookupBTN["hg19"] = json.load(open(fnp))
    fnp = os.path.join(os.path.dirname(__file__),
                       "../cellTypeToTissue.mm10.json")
    lookupBTN["mm10"] = json.load(open(fnp))

    @staticmethod
    def TranslateTissue(assembly, exp):
        t = exp.jsondata["organ_slims"]
        if t:
            t = t[0]
        else:
            t = ""
        lookup = DetermineTissue.lookupTissue[assembly]
        if t in lookup:
            return lookup[t]
        ct = exp.biosample_term_name
        lookup = DetermineTissue.lookupBTN[assembly]
        if ct in lookup:
            return lookup[ct]
        if ct.endswith("erythroid progenitor cells"):
            return "blood"
        return ""

class CellTypeInfoRow:
    def __init__(self, assembly, assay, toks):
        self.assembly = assembly
        self.assay = assay
        self.expID = toks[0]
        self.fileID = toks[1]
        self.cellTypeName = toks[2]

        exp = Exp.fromJsonFile(self.expID)
        self.tissue = DetermineTissue.TranslateTissue(assembly, exp)

        self.biosample_term_name = exp.biosample_term_name
        self.biosample_summary = exp.jsondata.get("biosample_summary",
                                                  self.biosample_term_name)

        self.biosample_type = exp.jsondata["biosample_type"]
        if isinstance(self.biosample_type, list):
            if len(self.biosample_type) > 1:
                print("multiple items for biosample_type:", self.biosample_type)
            self.biosample_type = self.biosample_type[0]

        print(self.output())

    def output(self):
        return '\t'.join([self.assay, self.expID, self.fileID,
                          self.tissue, self.biosample_summary,
                          self.biosample_type, self.cellTypeName])

class ImportCellTypeInfo:
    def __init__(self, curs, assembly):
        self.curs = curs
        self.assembly = assembly
        self.determineTissue = DetermineTissue()

    def importRankIndexes(self):
        d = os.path.join("/project/umw_zhiping_weng/0_metadata/encyclopedia/",
                         "Version-4", "ver9", self.assembly, "newway")
        fnp = os.path.join(d, "parsed.cellTypeIndexes.chrY.tsv")
        tableName = self.assembly + "_rankCellTypeIndexex"
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
rankMethod text,
cellType text,
idx integer);""".format(tableName = tableName))

        cols = ["rankMethod", "cellType", "idx"]
        with open(fnp) as f:
            print("importing", fnp, "into", tableName)
            self.curs.copy_from(f, tableName, '\t', columns=cols)

    def importDatasets(self):
        d = os.path.join("/project/umw_zhiping_weng/0_metadata/encyclopedia/",
                         "Version-4", "ver9", self.assembly, "raw")

        fns = {"CTCF" : "CTCF-List.txt",
               "DNase" : "DNase-List.txt",
               "H3K27ac" : "H3K27ac-List.txt",
               "H3K4me3" : "H3K4me3-List.txt"}

        outRows = []
        for assay, fn in fns.iteritems():
            fnp = os.path.join(d, fn)
            with open(fnp) as f:
                rows = f.readlines()
            for r in rows:
                toks = r.rstrip().split('\t')
                # assay, exp accession, file accession, cellType
                outRows.append(CellTypeInfoRow(self.assembly, assay, toks))

        tableName = self.assembly + "_datasets"
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
assay text,
expID text,
fileID text,
tissue text,
biosample_summary text,
biosample_type text,
cellTypeName text);""".format(tableName = tableName))

        cols = ["assay", "expID", "fileID", "tissue", "biosample_summary",
                "biosample_type", "cellTypeName"]

        outF = StringIO.StringIO()
        for r in outRows:
            outF.write(r.output() + '\n')
        outF.seek(0)
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        print("updated", tableName)

        fns = {"Enhancer" : "Enhancer-List.txt",
               "Insulator" : "Insulator-List.txt",
               "Promoter" : "Promoter-List.txt"}

    def run(self):
        self.importDatasets()
        #self.importRankIndexes()


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    for assembly in ["mm10", "hg19"]:
        with getcursor(DBCONN, "3_cellTypeInfo") as curs:
            pd = ImportCellTypeInfo(curs, assembly)
            pd.run()

    return 0

if __name__ == '__main__':
    main()

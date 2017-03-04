#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, psycopg2, re, argparse
import StringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from exp import Exp
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, eprint, AddPath

AddPath(__file__, '../common/')
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths

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
                       "../cellTypeToTissue.hg19.json")
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
        eprint(assembly, "missing", ct)
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

        if "mm10" == self.assembly:
            bs = self.biosample_summary
            bs = bs.replace("C57BL/6 ", "")
            matches = re.findall(r"\ (\((.*) days\))", bs)
            #print(bs, matches, len(matches))
            if matches and 1 == len(matches):
                bs = bs.replace(matches[0][0], "e" + matches[0][1])
                bs = bs.replace("postnatal e", "p").replace("embryo e", "e")
            #print("new bs", bs)
            self.biosample_summary = bs

        out = self.output().encode('ascii', 'ignore').decode('ascii')
        #print(out)

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
        tableName = self.assembly + "_rankCellTypeIndexex"
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
rankMethod text,
cellType text,
idx integer);""".format(tableName = tableName))

        fnBases = [("CTCF", 2),
                   ("DNase", 2),
                   ("Enhancer", 4),
                   ("H3K27ac", 2),
                   ("H3K4me3", 2),
                   ("Insulator", 4),
                   ("Promoter", 4)]

        outF = StringIO.StringIO()

        for fnBase, ctIdx in fnBases:
            fn = fnBase + "-List.txt"
            fnp = paths.path(self.assembly, "raw", fn)
            if not os.path.exists(fnp):
                raise Exception("missing " + fnp)
            with open(fnp) as f:
                rows = [x.rstrip('\n').split('\t') for x in f]
            for rowIdx, r in enumerate(rows):
                # PostgresQL arrays are 1-based
                s = '\t'.join([fnBase, r[ctIdx], str(rowIdx + 1)])
                outF.write(s + '\n')
            print("example:", s)
        outF.seek(0)

        cols = ["rankMethod", "cellType", "idx"]
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        print("\tok", self.curs.rowcount)

    def importDatasets(self):
        d = paths.path(self.assembly, "raw")

        fns = {"CTCF" : "ctcf-list.txt",
               "DNase" : "dnase-list.txt",
               "H3K27ac" : "h3k27ac-list.txt",
               "H3K4me3" : "h3k4me3-list.txt"}

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

    def importDatasetsMulti(self):
        d = paths.path(self.assembly, "raw")

        fns = {"Enhancer" : ("enhancer-list.txt", "H3K27ac"),
               "Insulator" : ("insulator-list.txt", "CTCF"),
               "Promoter" : ("promoter-list.txt", "H3K4me3")}

        outRows = []
        for assay, fnAndAssay in fns.iteritems():
            fn = fnAndAssay[0]
            fnp = os.path.join(d, fn)
            with open(fnp) as f:
                rows = f.readlines()
            assayTypes = fn.split('-')[0]
            other_assay = fnAndAssay[1]
            for r in rows:
                toks = r.rstrip().split('\t')
                # assay, exp accession, file accession, cellType
                outRows.append([assayTypes, toks[0], toks[1], other_assay,
                                toks[2], toks[3], toks[4]])

        tableName = self.assembly + "_datasets_multi"
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
assays text,
dnase_expID text,
dnase_fileID text,
other_assay text,
other_expID text,
other_fileID text,
cellTypeName text);""".format(tableName = tableName))

        cols = "assays dnase_expID dnase_fileID other_assay other_expID other_fileID cellTypeName".split(' ')

        outF = StringIO.StringIO()
        for r in outRows:
            outF.write('\t'.join(r) + '\n')
        outF.seek(0)
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        print("updated", tableName)

    def run(self):
        self.importDatasetsMulti()
        self.importDatasets()
        self.importRankIndexes()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))

    assemblies = ["mm10", "hg19"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        with getcursor(DBCONN, "04_cellTypeInfo") as curs:
            pd = ImportCellTypeInfo(curs, assembly)
            pd.run()

    return 0

if __name__ == '__main__':
    main()

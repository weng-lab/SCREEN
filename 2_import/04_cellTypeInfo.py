#!/usr/bin/env python2

from __future__ import print_function
import os
import sys
import json
import psycopg2
import re
import argparse
import StringIO
import gzip
from joblib import Parallel, delayed

from determine_tissue import DetermineTissue

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from exp import Exp
from db_utils import getcursor
from files_and_paths import Dirs, Tools, Genome, Datasets
from utils import Utils, eprint, AddPath, printt
from cache_memcache import MemCacheWrapper
from querydcc import QueryDCC
from db_utils import getcursor, vacumnAnalyze, makeIndex, makeIndexIntRange

AddPath(__file__, '../common/')
from dbconnect import db_connect
from constants import chroms, chrom_lengths, paths
from config import Config

def runCellTypeInfoRow(assembly, assay, r):
    toks = r.rstrip().split('\t')
    ctir = CellTypeInfoRow(assembly, assay, toks)
    return ctir.output()

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
                printt("multiple items for biosample_type:", self.biosample_type)
            self.biosample_type = self.biosample_type[0]

        if "mm10" == self.assembly:
            bs = self.biosample_summary
            bs = bs.replace("C57BL/6 ", "")
            matches = re.findall(r"\ (\((.*) days\))", bs)
            #printt(bs, matches, len(matches))
            if matches and 1 == len(matches):
                bs = bs.replace(matches[0][0], "e" + matches[0][1])
                bs = bs.replace("postnatal e", "p").replace("embryo e", "e")
            #printt("new bs", bs)
            self.biosample_summary = bs

        out = self.output().encode('ascii', 'ignore').decode('ascii')
        # printt(out)

    def output(self):
        return '\t'.join([self.assay, self.expID, self.fileID,
                          self.tissue, self.biosample_summary,
                          self.biosample_type, self.cellTypeName])


class ImportCellTypeInfo:
    def __init__(self, curs, assembly, args):
        self.curs = curs
        self.assembly = assembly
        self.args = args
        self.determineTissue = DetermineTissue()

    def importRankIndexes(self):
        tableName = self.assembly + "_rankCellTypeIndexex"
        self.curs.execute("""
    DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
rankMethod text,
cellType text,
idx integer);""".format(tableName=tableName))

        fnBases = [("CTCF", 2),
                   ("DNase", 2),
                   ("Enhancer", 4),
                   ("H3K27ac", 2),
                   ("H3K4me3", 2),
                   ("Insulator", 4),
                   ("Promoter", 4)]

        outF = StringIO.StringIO()

        for fnBase, ctIdx in fnBases:
            fn = fnBase + "-list.txt"
            fnp = paths.path(self.assembly, "raw", fn.lower())
            if not os.path.exists(fnp):
                raise Exception("missing " + fnp)
            with open(fnp) as f:
                rows = [x.rstrip('\n').split('\t') for x in f]
            for rowIdx, r in enumerate(rows):
                # PostgresQL arrays are 1-based
                s = '\t'.join([fnBase, r[ctIdx], str(rowIdx + 1)])
                outF.write(s + '\n')
            printt("example:", s)
        outF.seek(0)

        cols = ["rankMethod", "cellType", "idx"]
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        printt("\tok", self.curs.rowcount)

    def importDatasets(self):
        d = paths.path(self.assembly, "raw")

        fns = {"CTCF": "ctcf-list.txt",
               "DNase": "dnase-list.txt",
               "H3K27ac": "h3k27ac-list.txt",
               "H3K4me3": "h3k4me3-list.txt"}

        outRows = []
        for assay, fn in fns.iteritems():
            fnp = os.path.join(d, fn)
            with open(fnp) as f:
                rows = f.readlines()
            outRows += Parallel(n_jobs=self.args.j)(delayed(runCellTypeInfoRow)(
                self.assembly, assay, r) for r in rows)

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
cellTypeName text);""".format(tableName=tableName))

        cols = ["assay", "expID", "fileID", "tissue", "biosample_summary",
                "biosample_type", "cellTypeName"]

        outF = StringIO.StringIO()
        for r in outRows:
            outF.write(r + '\n')
        outF.seek(0)
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        printt("updated", tableName)

    def importDatasetsMulti(self):
        d = paths.path(self.assembly, "raw")

        fns = {"Enhancer": ("enhancer-list.txt", "H3K27ac"),
               "Insulator": ("insulator-list.txt", "CTCF"),
               "Promoter": ("promoter-list.txt", "H3K4me3")}

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
cellTypeName text);""".format(tableName=tableName))

        cols = "assays dnase_expID dnase_fileID other_assay other_expID other_fileID cellTypeName".split(' ')

        outF = StringIO.StringIO()
        for r in outRows:
            outF.write('\t'.join(r) + '\n')
        outF.seek(0)
        self.curs.copy_from(outF, tableName, '\t', columns=cols)
        printt("updated", tableName)

    def run(self):
        printt("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ ImportCellTypeInfo")
        self.importDatasetsMulti()
        self.importDatasets()
        self.importRankIndexes()

def get9stateInfo(assembly, r):
    mc = MemCacheWrapper(Config.memcache)
    qd = QueryDCC(auth=False, cache=mc)

    fileIDs = filter(lambda x: x.startswith("EN"),
                     [r[2], r[3], r[4], r[5]])
    for fileID in fileIDs:
        exp = qd.getExpFromFileID(fileIDs[0])
        tissue = DetermineTissue.TranslateTissue(assembly, exp)
        if tissue:
            break
    return '\t'.join(r + [assembly, tissue])

class NineState:
    def __init__(self, curs, assembly, args):
        self.curs = curs
        self.assembly = assembly
        self.args = args
        self.tableName = assembly + "_nine_state"
        self.inFnp = paths.path(self.assembly,
                                self.assembly + "-Look-Up-Matrix.txt")

    def run(self):
        printt("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ NineState")
        self._setupTable()
        self._doImport()
        self._doIndex()
        self._doUpdate()

    def _setupTable(self):
        printt("drop and create", self.tableName)
        self.curs.execute("""
        DROP TABLE IF EXISTS {tn};
        CREATE TABLE {tn}
        (id serial PRIMARY KEY,
        assembly text,
        cellTypeName text,
        cellTypeDesc text,
        tissue text,
        dnase text,
        h3k4me3 text,
        h3k27ac text,
        ctcf text
        );""".format(tn=self.tableName))

    def _doImport(self):
        printt("reading", self.inFnp)
        with open(self.inFnp) as f:
            rows = [line.rstrip('\n').split('\t') for line in f]
        printt("rows", "{:,}".format(len(rows)))

        printt("rewrite rows")
        outRows = Parallel(n_jobs=self.args.j)(delayed(get9stateInfo)(
                self.assembly, r) for r in rows)

        outF = StringIO.StringIO()
        for r in outRows:
            outF.write(r + '\n')

        outF.seek(0)
        cols = ["cellTypeName", "cellTypeDesc", "dnase", "h3k4me3",
                "h3k27ac", "ctcf", "assembly", "tissue"]
        self.curs.copy_from(outF, self.tableName, '\t', columns=cols)

        if 0 == self.curs.rowcount:
            raise Exception("error: no rows inserted")
        printt("inserted", "{:,}".format(self.curs.rowcount))

    def _doUpdate(self):
        printt("adding col...")
        self.curs.execute("""
        ALTER TABLE {tncres}
        DROP COLUMN IF EXISTS cellTypeDesc;

        ALTER TABLE {tncres}
        ADD COLUMN cellTypeDesc text;

        UPDATE {tncres} as ds
        SET cellTypeDesc = ns.cellTypeDesc
        FROM {tn} as ns
        where ds.cellTypeName = ns.cellTypeName
    """.format(tn=self.tableName, tncres=self.assembly + "_datasets"))

        if 0 == self.curs.rowcount:
            raise Exception("error: no cRE rows updated")
        printt("updated", "{:,}".format(self.curs.rowcount))

    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["cellTypeName", "cellTypeDesc"])

def runOntology(oid, infos):
    vals = {}
    for k, v in infos.iteritems():
        if isinstance(v, list):
            t = [x.strip() for x in v]  # remove newlines
            vals[k] = filter(lambda x: " coup de sabre" not in x and '\\' not in x and '"' not in x, t)
        else:
            if '{' in v or '"' in v:
                vals[k] = ''
            else:
                vals[k] = v
    nvals = {k: v for k, v in vals.iteritems() if v}
    return '\t'.join([oid, json.dumps(nvals)])

class Ontology:
    def __init__(self, curs, assembly, args):
        self.curs = curs
        self.assembly = assembly
        self.args = args
        self.tableName = "ontology"

    def run(self):
        printt("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ Ontology")
        self._import()
        self._doIndex()

    def _import(self):
        printt('***********', "drop and create", self.tableName)

        # "AEO:0001021": {
        #                 "assay": [],
        #                 "category": [],
        #                 "developmental": [],
        #                 "name": "stem cell population",
        #                 "objectives": [],
        #                 "organs": [],
        #                 "part_of": [],
        #                 "preferred_name": "",
        #                 "slims": [],
        #                 "synonyms": [],
        #                 "systems": [],
        #                 "types": []
        #             },

        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
oid text,
info jsonb
);""".format(tableName=self.tableName))

        printt('***********', "import ontology info")
        downloadDate = '2017-10Oct-25'
        fnp = paths.path("ontology", downloadDate, "ontology.json.gz")

        with gzip.open(fnp, "rb") as f:
            kv = json.load(f)

        outRows = Parallel(n_jobs=self.args.j)(delayed(runOntology)(
            oid, infos) for oid, infos in kv.iteritems())

        outF = StringIO.StringIO()
        for r in outRows:
            outF.write(r + '\n')
        outF.seek(0)

        cols = ["oid", "info"]
        self.curs.copy_from(outF, self.tableName, '\t', columns=cols)
        if 0 == self.curs.rowcount:
            raise Exception("error: no rows inserted")
        printt("imported", self.curs.rowcount, "rows", self.tableName)

    def _doIndex(self):
        #makeIndexTextPatternOps(self.curs, self.tableName, ["synonym"])
        #makeIndexGinTrgmOps(self.curs, self.tableName, ["synonym"])
        makeIndex(self.curs, self.tableName, ["oid"])

def ontologyToCellTypes(line):
    mc = MemCacheWrapper("localhost")
    qd = QueryDCC(auth=False, cache=mc)

    toks = line.strip().split('\t')
    ct = toks[0]

    ret = []

    for fileID in toks[2:]:
        fileID = fileID.strip()
        if not fileID or 'NA' == fileID:
            continue
        exp = qd.getExpFromFileID(fileID)
        bsi = exp.jsondata.get("biosample_term_id", [])
        if not bsi:
            printt(expID, "missing biosample_term_id")
        if not isinstance(bsi, list):
            bsi = [bsi]
        for i in bsi:
            ret.append([ct, i])
    return ret

class OntologyToCellTypes:
    def __init__(self, curs, assembly, args):
        self.curs = curs
        self.assembly = assembly
        self.args = args
        self.tableName = self.assembly + "_ontology_lookup"

    def run(self):
        printt("~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~ OntologyToCellTypes")
        self._import()
        self._doIndex()
        self._addOntology()
        self._addOntologyDatasets()

    def _import(self):
        lookup = []

        fnp = paths.path(self.assembly, self.assembly + "-Look-Up-Matrix.txt")
        printt("parsing", fnp)
        with open(fnp) as f:
            rows = [x.strip() for x in f]

        outRows = Parallel(n_jobs=self.args.j)(delayed(ontologyToCellTypes)(
            line) for line in rows)

        printt('***********', "drop and create", self.tableName)
        self.curs.execute("""
DROP TABLE IF EXISTS {tableName};
CREATE TABLE {tableName}
(id serial PRIMARY KEY,
cellTypeName text,
biosample_term_id text,
synonyms jsonb
);""".format(tableName=self.tableName))

        printt('***********', "import lookup")
        printt("rewrite rows")
        outF = StringIO.StringIO()
        for row in outRows:
            for r in row:
                outF.write('\t'.join(r) + '\n')
        outF.seek(0)

        cols = ["cellTypeName", "biosample_term_id"]
        self.curs.copy_from(outF, self.tableName, '\t', columns=cols)
        printt("copied in", self.curs.rowcount)

    def _addOntology(self):
        self.curs.execute("""
UPDATE {tn} AS oi
SET synonyms = o.info->'synonyms'
FROM ontology AS o
WHERE o.oid = oi.biosample_term_id
    """.format(tn=self.tableName))
        if 0 == self.curs.rowcount:
            raise Exception("error: no cRE rows updated")
        printt("updated ontology_info:", "{:,}".format(self.curs.rowcount))

    def _addOntologyDatasets(self):
        printt("adding col...")
        self.curs.execute("""
        ALTER TABLE {tncres}
        DROP COLUMN IF EXISTS synonyms;

        ALTER TABLE {tncres}
        ADD COLUMN synonyms jsonb;

        UPDATE {tncres} as ds
        SET synonyms = oi.synonyms
        FROM {tn} as oi
        where ds.cellTypeName = oi.cellTypeName
    """.format(tn=self.tableName, tncres=self.assembly + "_datasets"))
        if 0 == self.curs.rowcount:
            raise Exception("error: no cRE rows updated")
        printt("updated dataets:", "{:,}".format(self.curs.rowcount))

    def _doIndex(self):
        makeIndex(self.curs, self.tableName, ["cellTypeName"])



def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        printt('***********', assembly)
        with getcursor(DBCONN, "04_cellTypeInfo") as curs:
            pd = ImportCellTypeInfo(curs, assembly, args)
            pd.run()
            icg = NineState(curs, assembly, args)
            icg.run()
            c = Ontology(curs, assembly, args)
            c.run()
            c = OntologyToCellTypes(curs, assembly, args)
            c.run()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('-j', type=int, default=4)
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args


def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)

    return 0


if __name__ == '__main__':
    main()

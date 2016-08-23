#!/usr/bin/env python

from __future__ import print_function

import os, sys, json, psycopg2, argparse, fileinput
import cStringIO

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils, printWroteNumLines
from dbs import DBS
from metadataws import MetadataWS
from files_and_paths import Genome, Datasets

def GetChroms(assembly):
    with open(Genome.ChrLenByAssembly(assembly)) as f:
        allChroms = [line.split('\t')[0] for line in f]
    chroms = []
    for chrom in allChroms:
        if len(chrom) > 5:
            continue
        chroms.append(chrom)
    chroms.sort()
    print(chroms)
    return chroms

class LoadBeds:
    def __init__(self, args, conn, cur, assembly):
        self.args = args
        self.conn = conn
        self.cur = cur
        self.assembly = assembly
        self.assays = ["dnase", "tf", "histone"]
        self.chroms = GetChroms(assembly)

        if assembly.startswith("mm10"):
            self.datasets = MetadataWS(Datasets.all_mouse)
        else:
            self.datasets = MetadataWS(Datasets.all_human)

    def rebuild(self):
        self.setupDB()

        print("rebuilding", self.assembly)
        self.insertAssay("dnase", self.datasets.dnases_useful(self.args))
        self.insertAssay("tf", self.datasets.chipseq_tfs_useful(self.args))
        self.insertAssay("histone", self.datasets.chipseq_histones_useful(self.args))

        self.index()

    def tableName(self, assembly, assay, chrom):
        return "bed_ranges_{assembly}_{assay}_{chrom}".format(
            assembly = assembly.replace('-', '_'), assay=assay, chrom=chrom)
    
    def setupDB(self):
        for assay in self.assays:
            for chrom in self.chroms:
                tableName = self.tableName(self.assembly, assay, chrom)
                print('\t', "dropping and creating", tableName)
                self.cur.execute("""
                DROP TABLE IF EXISTS {tableName};
                CREATE TABLE {tableName}
                (id serial PRIMARY KEY,
                startend int4range,
                file_accession text
                ) """.format(tableName = tableName))

    def insertAssay(self, assay, exps):
        for exp in exps:
            try:
                beds = exp.bedFilters()
                if not beds:
                    print("missing", exp)
                for bed in beds:
                    if not self.assembly == bed.assembly:
                        continue
                    self.insertFile(exp, assay, bed)
            except Exception, e:
                print(str(e))
                print("bad exp:", exp)
        self.conn.commit()

    def insertFile(self, exp, assay, bed):
        fnp = bed.fnp()
        peaks = [r for r in fileinput.input(fnp, mode="r", openhook=fileinput.hook_compressed)]
        outFs = {}
        for chrom in self.chroms:
            outFs[chrom] = cStringIO.StringIO()

        badPeaks = 0
        for peak in peaks:
            toks = peak.rstrip().split('\t') # chrom, start, end, etc...
            chrom = toks[0]
            if chrom not in outFs:
                badPeaks += 1
                continue
            outFs[chrom].write('[' + toks[1] + ',' + toks[2] + ')\t' + bed.fileID + '\n')

        peakNums = 0
        for chrom in self.chroms:
            tableName = self.tableName(self.assembly, assay, chrom)
            outFs[chrom].seek(0)
            self.cur.copy_from(outFs[chrom], tableName,
                               columns=("startend", "file_accession"))
            peakNums += self.cur.rowcount

        print("\t", self.assembly, assay, "{:,}".format(peakNums), badPeaks, fnp)

    def index(self):
        for assay in self.assays:
            for chrom in self.chroms:
                print("indexing", self.assembly, assay, chrom, "startend")
                tableName = self.tableName(self.assembly, assay, chrom)
                indexName = "rangeIdx_" + tableName

                self.cur.execute("""
                DROP INDEX IF EXISTS {indexName};
                CREATE INDEX {indexName} ON {tableName} USING gist (startend);
                """.format(indexName = indexName, tableName = tableName))

def test(cur):
    # check chr1:134054000-134071000
    cur.execute("""
SELECT DISTINCT expID
FROM bed_ranges_mm10
WHERE chrom = 'chr1'
AND startend && int4range(134054000, 134071000)
""")
    print(cur.fetchall())

def counts(cur, assembly):
    cur.execute("""
select count(1)
from bed_ranges_{assembly}
""".format(assembly = assembly))
    print(assembly, cur.fetchone())

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--process', action="store_true", default=True)
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--dump', action="store_true", default=False)
    parser.add_argument('--rebuild', action="store_true", default=False)
    parser.add_argument('--index', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    if args.local:
        dbs = DBS.localRegElmViz()
    else:
        dbs = DBS.pgdsn("RegElmViz")
    dbs["application_name"] = os.path.basename(__file__)

    if args.dump:
        for assembly in ["hg19", "mm10"]:
            print(assembly, GetChroms(assembly))
        return

    assemblies = ["hg19", "mm10", "mm10-minimal"]
    
    with psycopg2.connect(**dbs) as conn:
        with conn.cursor() as cur:
            for assembly in assemblies:
                loadBeds = LoadBeds(args, conn, cur, assembly)
                if args.rebuild:
                    loadBeds.rebuild()
                if args.index:
                    loadBeds.index()

if __name__ == '__main__':
    main()

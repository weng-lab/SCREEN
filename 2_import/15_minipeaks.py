#!/usr/bin/env python

from __future__ import print_function
import os, sys, argparse

from cassandra.cluster import Cluster
from cassandra.query import BatchStatement
from cassandra import ConsistencyLevel

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt

class ImportMinipeaks:
    def __init__(self, assembly, nbins, ver):
        self.assembly = assembly
        self.nbins = nbins
        self.ver = ver

        self.cluster = Cluster()
        self.session = self.cluster.connect()
        self.session.execute("""CREATE KEYSPACE IF NOT EXISTS minipeaks
WITH replication = {'class':'SimpleStrategy', 'replication_factor':1};""")
        self.session.set_keyspace("minipeaks")

    def importAll(self):
        for assay in ["DNase", "H3K27ac", "H3K4me3"]:
            self._doImport(assay)

    def _doImport(self, assay):
        tableName = '_'.join([self.assembly, assay,
                              str(self.ver), str(self.nbins)])

        colsFnp = paths.path(self.assembly, "minipeaks", assay + "_cols.txt")
        with open(colsFnp) as f:
            fileIDs = f.readline().rstrip('\n').split('\t')

        self.session.execute("""
DROP TABLE IF EXISTS """ + tableName)

        self.session.execute("""
CREATE TABLE {tn} (
accession text,
chrom text,
{fields},
PRIMARY KEY (accession, chrom) )
WITH compression = {{ 'sstable_compression' : 'LZ4Compressor' }};
""".format(tn = tableName,
           fields = ",".join([r + " text" for r in fileIDs])))

        mergedFnp = paths.path(self.assembly, "minipeaks", assay + "_merged.txt")
        #printt("import", mergedFnp)

        cols = ["accession", "chrom"] + fileIDs
        q = """COPY {tn} ({fields}) from '{fn}' WITH DELIMITER = '\\t' AND NUMPROCESSES = 16 AND MAXBATCHSIZE = 1;""".format(
            tn = tableName, fields = ",".join(cols),
            fn = mergedFnp)
        print(q)
        #self.session.execute(q)

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    assemblies = ["mm10", "hg19"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        im = ImportMinipeaks(assembly, 20, 2)
        im.importAll()

if __name__ == '__main__':
    main()

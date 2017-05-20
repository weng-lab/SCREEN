#!/usr/bin/env python

from __future__ import print_function
import os, sys, argparse

from cassandra.cluster import Cluster
from cassandra.query import BatchStatement
from cassandra import ConsistencyLevel

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect
from constants import paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt, printWroteNumLines
from files_and_paths import Dirs
from get_yes_no import GetYesNoToQuestion

class ImportMinipeaks:
    def __init__(self, assembly, nbins, ver):
        self.assembly = assembly
        self.nbins = nbins
        self.ver = ver

        self.cluster = Cluster(["cassandra.docker"])
        self.session = self.cluster.connect()
        self.session.execute("""CREATE KEYSPACE IF NOT EXISTS minipeaks
WITH replication = {'class':'SimpleStrategy', 'replication_factor':1};""")
        self.session.set_keyspace("minipeaks")

    def importAll(self, outF, sample):
        for assay in ["dnase", "h3k27ac", "h3k4me3"]:
            self._doImport(assay, outF, sample)

    def _doImport(self, assay, outF, sample):
        tableName = '_'.join([self.assembly, assay,
                              str(self.ver), str(self.nbins)])

        colsFnp = paths.path(self.assembly, "minipeaks", "merged", assay + "_cols.txt")
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

        mergedFnp = paths.path(self.assembly, "minipeaks", "merged",
                               assay + "_merged.txt")
        if sample:
            mergedFnp = paths.path(self.assembly, "minipeaks", "merged",
                                   "sample", assay + "_merged.txt")
        if not os.path.exists(mergedFnp):
            raise Exception("missing file: " + mergedFnp)

        cols = ["accession", "chrom"] + fileIDs
        q = """COPY {tn} ({fields}) from '{fn}' WITH DELIMITER = '\\t' AND NUMPROCESSES = 8 AND MAXBATCHSIZE = 1;""".format(
            tn = tableName, fields = ",".join(cols),
            fn = mergedFnp)
        outF.write(q + '\n\n')

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    ver = Config.minipeaks_ver

    for assembly in assemblies:
        printt('***********', assembly)

        if not args.yes:
            if not GetYesNoToQuestion.immediate("OK remove old tables for version " + ver + "?"):
                printt("skipping", assembly)
                return

        queryFnp = paths.path(assembly, "minipeaks", "merged",
                              "insert_minipeaks." + assembly + ".cql")
        with open(queryFnp, 'w') as outF:
            outF.write("use minipeaks;\n")
            for assembly in assemblies:
                im = ImportMinipeaks(assembly, 20, ver)
                im.importAll(outF, args.sample)

        printWroteNumLines(queryFnp)
        cmds = ['CQLSH_HOST="cassandra.docker"',
                os.path.join(Dirs.tools, "apache-cassandra-3.0.9/bin/cqlsh"),
                "--cqlversion=3.4.2",
                "-f", queryFnp]
        if args.yes or GetYesNoToQuestion.immediate("import data?"):
            print(Utils.runCmds(cmds))

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument("--assembly", type=str, default="")
    parser.add_argument('--sample', action="store_true", default=False)
    parser.add_argument('--yes', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    run(args, DBCONN)

if __name__ == '__main__':
    main()

#!/usr/bin/env python

from __future__ import print_function
import os, sys, argparse

from cassandra.cluster import Cluster
from cassandra.query import BatchStatement
from cassandra import ConsistencyLevel

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from constants import paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt, printWroteNumLines
from files_and_paths import Dirs
from get_yes_no import GetYesNoToQuestion

class ImportMinipeaks:
    def __init__(self, assembly, nbins, ver, cores):
        self.assembly = assembly
        self.nbins = nbins
        self.ver = ver
        self.cores = cores

        self.cluster = Cluster(["cassandra.docker"])
        self.session = self.cluster.connect()
        self.session.execute("""CREATE KEYSPACE IF NOT EXISTS minipeaks
WITH replication = {'class':'SimpleStrategy', 'replication_factor':1};""")
        self.session.set_keyspace("minipeaks")
        self.minipeaks = paths.path(assembly, "minipeaks", str(ver), str(nbins))

    def importAll(self, outF, sample):
        for assay in ["dnase", "h3k27ac", "h3k4me3"]:
            self._doImport(assay, outF, sample)

    def _doImport(self, assay, outF, sample):
        tableName = '_'.join([self.assembly, assay,
                              str(self.ver), str(self.nbins)])

        colsFnp = os.path.join(self.minipeaks, "merged", assay + "_cols.txt")
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

        mergedFnp = os.path.join(self.minipeaks, "merged",
                                 assay + "_merged.txt")
        if sample:
            mergedFnp = os.path.join(self.minipeaks, "merged",
                                     "sample", assay + "_merged.txt")
        if not os.path.exists(mergedFnp):
            raise Exception("missing file: " + mergedFnp)

        cols = ["accession", "chrom"] + fileIDs
        q = """COPY {tn} ({fields}) from '{fn}' WITH DELIMITER = '\\t' AND NUMPROCESSES = {cores} AND MAXBATCHSIZE = 1;""".format(
            tn = tableName,
            cores = cores,
            fields = ",".join(cols),
            fn = mergedFnp)
        outF.write(q + '\n\n')

def run(args, DBCONN):
    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    nbins = Config.minipeaks_nbins
    if args.nbins > -1:
        nbins = args.nbins
    ver = Config.minipeaks_ver
    if args.ver > -1:
        ver = args.ver
    cores = args.j
    if args.sample:
        cores = 1
                
    for assembly in assemblies:
        printt('***********', assembly, ver, nbins)

        if not args.yes:
            s = "OK remove old tables for version %s, %s nbins?" % (ver, nbins)
            if not GetYesNoToQuestion.immediate(s):
                printt("skipping", assembly)
                continue

        minipeaks = paths.path(assembly, "minipeaks", str(ver), str(nbins))
        queryFnp = os.path.join(minipeaks, "merged",
                                "insert_minipeaks." + assembly + ".cql")
        with open(queryFnp, 'w') as outF:
            outF.write("use minipeaks;\n")
            for assembly in assemblies:
                im = ImportMinipeaks(assembly, nbins, ver, cores)
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
    parser.add_argument('-j', type=int, default=8)
    parser.add_argument('--ver', type=int, default=-1)
    parser.add_argument('--nbins', type=int, default=-1)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    run(args, None)

if __name__ == '__main__':
    main()

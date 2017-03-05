#!/usr/bin/env python

from __future__ import print_function
import os, sys, argparse

from cassandra.cluster import Cluster
from cassandra.query import BatchStatement
from cassandra import ConsistencyLevel

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from constants import paths

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils, printt, printWroteNumLines
from files_and_paths import Dirs
from get_yes_no import GetYesNoToQuestion

class ImportMinipeaks:
    def __init__(self, host, assembly, nbins, ver):
        self.host = host
        self.assembly = assembly
        self.nbins = nbins
        self.ver = ver

        if self.host:
            self.cluster = Cluster([self.host])
        else:
            self.cluster = Cluster()
        self.session = self.cluster.connect()
        self.session.execute("""CREATE KEYSPACE IF NOT EXISTS minipeaks
WITH replication = {'class':'SimpleStrategy', 'replication_factor':1};""")
        self.session.set_keyspace("minipeaks")

    def importAll(self, outF):
        for assay in ["DNase", "H3K27ac", "H3K4me3"]:
            self._doImport(assay, outF)

    def _doImport(self, assay, outF):
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
        q = """COPY {tn} ({fields}) from '{fn}' WITH DELIMITER = '\\t' AND NUMPROCESSES = 8 AND MAXBATCHSIZE = 1;""".format(
            tn = tableName, fields = ",".join(cols),
            fn = mergedFnp)
        outF.write(q + '\n\n')

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

    if not GetYesNoToQuestion.immediate("remove old tables?"):
        return 0

    queryFnp = os.path.join(paths.v4d, "insert_minipeaks.cql")
    with open(queryFnp, 'w') as outF:
        outF.write("use minipeaks;\n")
        for assembly in assemblies:
            im = ImportMinipeaks(args.host, assembly, 20, 3)
            im.importAll(outF)

    printWroteNumLines(queryFnp)
    cmds = ['CQLSH_HOST="cassandra"',
            os.path.join(Dirs.tools, "apache-cassandra-3.0.9/bin/cqlsh"),
            "--cqlversion=3.4.2",
            "-f", queryFnp]
    if GetYesNoToQuestion.immediate("import data?"):
        print(Utils.runCmds(cmds))


if __name__ == '__main__':
    main()

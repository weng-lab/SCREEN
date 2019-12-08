#!/usr/bin/env python3

from __future__ import print_function
import os
import sys
import argparse
import tempfile

from cassandra.cluster import Cluster
from cassandra.query import BatchStatement
from cassandra import ConsistencyLevel

sys.path.append(os.path.join(os.path.dirname(__file__), '../../common/'))
from constants import paths
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils/'))
from utils import Utils, printt, printWroteNumLines
from files_and_paths import Dirs
from get_yes_no import GetYesNoToQuestion


class ImportMinipeaks:
    def __init__(self, assembly, nbins, ver, cores):
        self.assembly = assembly
        self.nbins = nbins
        self.ver = ver
        self.cores = cores

        self.cluster = Cluster(Config.cassandra)
        self.session = self.cluster.connect()
        self.session.execute("""CREATE KEYSPACE IF NOT EXISTS minipeaks
WITH replication = {'class':'SimpleStrategy', 'replication_factor':1};""")
        self.session.set_keyspace("minipeaks")
        self.minipeaks = paths.path(assembly, "minipeaks", str(ver), str(nbins))

    def prepImportAndWriteScript(self, outF, sample):
        for assay in ["dnase", "h3k27ac", "h3k4me3"]:
            self._prepImportAndWriteScript(assay, outF, sample)

    def _prepImportAndWriteScript(self, assay, outF, sample):
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
""".format(tn=tableName,
           fields=",".join([r + " text" for r in fileIDs])))

        mergedFnp = os.path.join(self.minipeaks, "merged",
                                 assay + "_merged.txt")
        if sample:
            mergedFnp = os.path.join(self.minipeaks, "merged",
                                     "sample", assay + "_merged.txt")
        if not os.path.exists(mergedFnp):
            raise Exception("missing file: " + mergedFnp)

        cols = ["accession", "chrom"] + fileIDs
        q = """COPY {tn} ({fields}) from '{fn}' WITH DELIMITER = '\\t' AND NUMPROCESSES = {cores} AND MAXBATCHSIZE = 1;""".format(
            tn=tableName,
            cores=self.cores,
            fields=",".join(cols),
            fn=mergedFnp)
        outF.write(q + '\n\n')


def run(args, DBCONN):
    fnp = os.path.join(os.path.dirname(__file__), '../../../minipeak_import.txt')

    assemblies = Config.assemblies
    if args.assembly:
        assemblies = [args.assembly]

    cores = args.j
    if args.sample:
        cores = 1

    with open(fnp, 'w') as outF:
        for assembly in assemblies:
            for ver, nbins in [(6,20)]:
                if not args.yes:
                    s = "(Re)import %s, version %s, %s nbins?" % (assembly, ver, nbins)
                    if not GetYesNoToQuestion.immediate(s):
                        print("skipping", assembly, ver, nbins)
                        continue

                minipeaks = paths.path(assembly, "minipeaks", str(ver), str(nbins))

                outF.write("use minipeaks;\n")
                im = ImportMinipeaks(assembly, nbins, ver, cores)
                im.prepImportAndWriteScript(outF, args.sample)

    printWroteNumLines(fnp)
    cmds = ['CQLSH_HOST="{hosts}"'.format(hosts=Config.cassandra[0]),
            "cqlsh",
            "-f", fnp]
    print("please run this command:")
    print(' '.join(cmds))

    
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

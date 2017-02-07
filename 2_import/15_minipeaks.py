#!/usr/bin/env python

from __future__ import print_function
import os, sys, json, argparse

from cassandra.cluster import Cluster
from cassandra.query import BatchStatement
from cassandra import ConsistencyLevel

sys.path.append(os.path.join(os.path.dirname(__file__), '../common/'))
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils/'))
from utils import Utils
from db_utils import getcursor
from files_and_paths import Dirs

class ImportMinipeaks:
    def __init__(self, assembly, ver = 1):
        self.assembly = assembly
        self.ver = ver

        self.cluster = Cluster()
        self.session = self.cluster.connect()
        self.keyspace = "minipeaks_" + assembly)
        self.session.execute("""
        CREATE KEYSPACE IF NOT EXISTS {ks} WITH replication
        = {'class':'SimpleStrategy', 'replication_factor':1};
        """.format(ks = self.keyspace))
        self.session.set_keyspace(self.keyspace)

    def importAll(self):
        d = "/project/umw_zhiping_weng/0_metadata/encode/data"
        fns = ["DNase-List.txt", "H3K27ac-List.txt",
               "H3K4me3-List.txt"]

        outD = os.path.join(self.d, "minipeaks")

        for fn in fns:
            print("***********************", fn)
            fnp = os.path.join(self.d, "raw", fn)
            with open(fnp) as f:
                rows = [x.rstrip().split() for x in f.readlines()]
            bfnps = []
            for r in rows:
                fnp = os.path.join(outD, r[1] + ".bigWig.txt.gz")
                if os.path.exists(fnp):
                    bfnps.append(fnp)
                else:
                    print("WARNING: missing", fnp)

            toks = fn.split('-')
            self.processRankMethod(bfnps, toks[0])
            
    def processRankMethod(self, rows, rankMethod):
        tableName = rankMethod + '_' + str(self.ver)
        
        self.session.execute("""
DROP TABLE IF EXISTS """ + tableName)

        self.session.execute("""
CREATE TABLE IF NOT EXISTS {tn} (
accession text,
ver int,
ctAndAvgSignals text,
PRIMARY KEY (accession, ver) )
WITH compression = {{ 'sstable_compression' : 'LZ4Compressor' }};
""".format(tn = self.tableName))
        
    

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--local', action="store_true", default=False)
    args = parser.parse_args()
    return args

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__), args.local)

    assemblies = ["hg19", "mm10"]
    if args.assembly:
        assemblies = [args.assembly]

    for assembly in assemblies:
        im = ImportMinipeaks(assembly)
        im.importAll()
        
if __name__ == '__main__':
    main()

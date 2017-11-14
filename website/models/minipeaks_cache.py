#!/usr/bin/env python

from __future__ import print_function
import sys
import os
import json

from cassandra.cluster import Cluster
from cassandra.query import BatchStatement, dict_factory
from cassandra import ConsistencyLevel

sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
from config import Config


class MiniPeaksCache:
    def __init__(self, assembly, nbins, ver):
        self.assembly = assembly
        self.nbins = nbins
        self.ver = ver

        self.cluster = Cluster(Config.cassandra)
        self.session = self.cluster.connect()
        self.session.row_factory = dict_factory
        self.session.set_keyspace("minipeaks")

    def get(self, assay, accessions):
        tableName = '_'.join([self.assembly, assay,
                              str(self.ver), str(self.nbins)])

        select_stmt = self.session.prepare("""
SELECT * FROM {tn} WHERE accession IN ?
""".format(tn=tableName))

        rows = list(self.session.execute(select_stmt, (accessions,)))

        ret = {}
        for row in rows:
            data = {}
            for k, v in row.iteritems():
                if "accession" == k or "chrom" == k:
                    continue
                data[k.upper()] = [float(x) for x in v[1:-1].split(',')]
            ret[row["accession"]] = data
        return ret


if __name__ == "__main__":
    mpc = MiniPeaksCache("hg19", 0, 4)
    acc = "EH37E1055372"
    ret = mpc.get("DNase", [acc])
    for k, v in ret[acc].iteritems():
        print(k, v)

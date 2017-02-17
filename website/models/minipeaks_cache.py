#!/usr/bin/env python

import sys
import json

from cassandra.cluster import Cluster
from cassandra.query import BatchStatement, dict_factory
from cassandra import ConsistencyLevel

class MiniPeaksCache:
    def __init__(self, assembly, nbins, ver):
        self.assembly = assembly
        self.nbins = nbins
        self.ver = ver

    def get(self, assay, accessions):
        cluster = Cluster()
        session = cluster.connect()
        session.row_factory = dict_factory
        session.set_keyspace("minipeaks")

        tableName = '_'.join([self.assembly, assay,
                              str(self.ver), str(self.nbins)])

        select_stmt = session.prepare("""
SELECT * FROM {tn} WHERE accession IN ?
""".format(tn = tableName ))
        
        rows = list(session.execute(select_stmt, (accessions,)))

        ret = []
        for row in rows:
            data = {}
            for k, v in row.iteritems():
                if "accession" == k or "chrom" == k:
                    continue
                data[k.upper()] = [float(x) for x in v[1:-2].split(',')]
            nr = {"accession" : row["accession"],
                  "data" : data,
                  "chrom" : row["chrom"]}
            ret.append(nr)
        return ret

if __name__ == "__main__":
    mpc = MiniPeaksCache("mm10", 20, 2)
    ret = mpc.get("DNase", ["EM10E0371084"])
    for r in ret:
        for k, v in r.iteritems():
            print(r["accession"], r)

    if 0:
        j = mpc.get("EM10E0371084")
        if j:
            print(len(j))
            if 0:
                for ct, v in j.iteritems():
                    print(ct, v)

#!/usr/bin/env python

import sys
import json

from cassandra.cluster import Cluster
from cassandra.query import BatchStatement
from cassandra import ConsistencyLevel

class MiniPeaksCache:
    def __init__(self, rank_method, ver = 1):
        self.rank_method = rank_method
        self.ver = ver
        self.tableName = rank_method + '_' + str(ver)

        self.cluster = Cluster()
        self.session = self.cluster.connect()
        self.session.execute("""
CREATE KEYSPACE IF NOT EXISTS minipeaks WITH replication
= {'class':'SimpleStrategy', 'replication_factor':1};""")
        self.session.set_keyspace("minipeaks")

        if 0:
            self.session.execute("""
DROP TABLE """ + self.tableName)

        self.session.execute("""
CREATE TABLE IF NOT EXISTS {tn} (
accession text,
ver int,
ctAndAvgSignals text,
PRIMARY KEY (accession, ver) )
WITH compression = {{ 'sstable_compression' : 'LZ4Compressor' }};
""".format(tn = self.tableName))

        self.insert_stmt = self.session.prepare("""
INSERT INTO {tn} (accession, ver, ctAndAvgSignals) values (?, ?, ?)
""".format( tn = self.tableName))

        self.select_stmt = self.session.prepare("""
SELECT ctAndAvgSignals FROM {tn} WHERE accession = ? AND ver = ?
""".format(tn = self.tableName ))

    def insert(self, accession, values):
        self.session.execute(self.insert_stmt,
                             (accession, self.ver, json.dumps(values)))

    def get(self, accession):
        r = self.session.execute(self.select_stmt, (accession, self.ver))
        if not r:
            return {}
        return json.loads(r[0][0])

    def insertVec(self, accessionToCtAndValues):
        batch = BatchStatement(consistency_level=ConsistencyLevel.QUORUM)
        for acc, ctAndvalues in accessionToCtAndValues.iteritems():
            batch.add(self.insert_stmt, (acc, self.ver,
                                         json.dumps(ctAndvalues)))
        self.session.execute(batch)

    def getVec(self, accessions):
        batch = BatchStatement(consistency_level=ConsistencyLevel.QUORUM)
        ret = {}
        for acc in accessions:
            ret[acc] = self.get(acc)
        return ret

if __name__ == "__main__":
    mpc = MiniPeaksCache("dnase")
    ret = mpc.getVec(["EM10E0371084"])
    print(ret.keys())


    if 0:
        j = mpc.get("EM10E0371084")
        if j:
            print(len(j))
            if 0:
                for ct, v in j.iteritems():
                    print(ct, v)

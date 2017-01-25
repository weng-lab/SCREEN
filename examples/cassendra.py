#!/usr/bin/env python

import sys
import json

""" examples from:
http://stackoverflow.com/questions/24949676/difference-between-partition-key-composite-key-and-clustering-key-in-cassandra
http://docs.datastax.com/en/archived/cassandra/2.0/cassandra/operations/ops_config_compress_t.html
http://stackoverflow.com/questions/36342531/efficient-way-to-store-a-json-string-in-a-cassandra-column
https://datastax.github.io/python-driver/getting_started.html

"""

from cassandra.cluster import Cluster
cluster = Cluster()
session = cluster.connect()

session.execute("""CREATE KEYSPACE IF NOT EXISTS minipeaks WITH replication
                          = {'class':'SimpleStrategy', 'replication_factor':1};""")
session.set_keyspace("test")

session.execute("""
CREATE TABLE IF NOT EXISTS dnase (
              accession text,
              cellType text,
              values text,
              PRIMARY KEY (accession, cellType)
            )
            WITH compression = { 'sstable_compression' : 'LZ4Compressor' };
""")

stmt = session.prepare("INSERT INTO dnase (accession, cellType, values) values (?, ?, ?)")

for e in [("ee3", "asdfasdf", json.dumps({"a": 1})),
          ("ee4", "asdfasdqeqwef", json.dumps({"a": 1})),
          ("ee5", "aqerqrqsdfasdf", json.dumps({"a": 1}))]:
    session.execute(stmt, e)

if 0:
    session.execute("""
INSERT INTO dnase (accession, cellType, values)
values (%s, %s, %s)
 """, ("ee2", "asdfasdf", json.dumps({"a": 1})))

result = session.execute("select * from dnase")
for x in result:
    print(x)

if(0):
    result = session.execute("select * from users where lastname='Jones' ")[0]
    print result.firstname, result.age

    session.execute("update users set age = 36 where lastname = 'Jones'")
    result = session.execute("select * from users where lastname='Jones' ")[0]
    print result.firstname, result.age

    session.execute("delete from users where lastname = 'Jones'")


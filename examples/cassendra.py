#!/usr/bin/env python

import sys

from cassandra.cluster import Cluster
cluster = Cluster(['127.0.0.1'])
session = cluster.connect()

session.execute("""CREATE KEYSPACE IF NOT EXISTS test WITH replication
                          = {'class':'SimpleStrategy', 'replication_factor':1};""")
session.set_keyspace("test")

session.execute("""
CREATE TABLE IF NOT EXISTS MiniPeaksDNase (
              accession text,
              cellType text,
              values text,
              PRIMARY KEY (accession, cellType)
            )
            WITH compression = { 'sstable_compression' : 'LZ4Compressor' };
""")


session.execute("""
    insert into MiniPeaksDNase (accession, cellType, values) values ('ee1', 'asdfasdf', '{"a": 1}')
    """)
result = session.execute("select * from MiniPeaksDNase")
for x in result:
    print(x)

if(0):
    result = session.execute("select * from users where lastname='Jones' ")[0]
    print result.firstname, result.age

    session.execute("update users set age = 36 where lastname = 'Jones'")
    result = session.execute("select * from users where lastname='Jones' ")[0]
    print result.firstname, result.age

    session.execute("delete from users where lastname = 'Jones'")


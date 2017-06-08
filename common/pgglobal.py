from __future__ import print_function
import sys

class GlobalPG:
    def __init__(self, assembly):
        self._tablename = "_".join((assembly, "global_objects"))

    def drop_and_recreate(self, curs):
        curs.execute("""
        DROP TABLE IF EXISTS {tn};
        CREATE TABLE {tn} (
id serial PRIMARY KEY, 
name TEXT, 
obj jsonb
);""".format(tn = self._tablename))

    def doimport(self, keys, curs):
        for key, fnp in keys:
            with open(fnp, "rb") as f:
                curs.execute("""
                INSERT INTO {tn} (name, obj)
                VALUES (%s, %s::jsonb)
""".format(tn = self._tablename),
                             (key, f.read()))

    def select(self, name, curs):
        curs.execute("""
SELECT obj FROM {tn} 
WHERE name = %s
""".format(tn = self._tablename), (name,))
        return curs.fetchone()[0]

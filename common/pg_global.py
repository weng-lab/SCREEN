import sys

from cre_utils import checkAssembly


class GlobalPG:
    def __init__(self, pw, assembly):
        self.pw = pw
        self._tablename = "_".join((assembly, "global_objects"))

    def drop_and_recreate(self):
        self.pw.execute("drop_and_recreate", """
        DROP TABLE IF EXISTS {tn};
        CREATE TABLE {tn} (
        id serial PRIMARY KEY, 
        name TEXT, 
        obj jsonb
        );""".format(tn=self._tablename))

    def doimport(self, keys):
        for key, fnp in keys:
            with open(fnp, "rb") as f:
                self.pw.execute("doimport", """
                INSERT INTO {tn} (name, obj)
                VALUES (%s, %s::jsonb)
                """.format(tn=self._tablename),
                                (key, f.read()))
                
    def select(self, name):
        row = self.pw.fetchone("select", """
        SELECT obj FROM {tn} 
        WHERE name = %s
        """.format(tn=self._tablename),
                               (name,))
        return row[0]

    def select_external(self, name, assembly):
        checkAssembly(assembly)

        row = self.pw.fetchone("select_external", """
        SELECT obj FROM {assembly}_{tn}
        WHERE name = %s
        """.format(tn="global_objects", assembly=assembly),
                               (name,))
        return row[0]

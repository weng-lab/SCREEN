import sys, os
sys.path.append(os.path.join(os.path.realpath(__file__), "../../metadata/utils"))
from db_utils import getcursor

def _second_onward(arr):
    if len(arr) == 1: return []
    return arr[1:]

class AutocompleterWrapper:
    def __init__(self, ps):
        self.acs = {
            "hg19" : Autocompleter(ps, "hg19"),
            "mm10" : Autocompleter(ps, "mm10")}

    def __getitem__(self, assembly):
        return self.acs[assembly]

    def get_suggestions(self, q):
        p = q.split(" ")
        for i in xrange(len(p)):
            prefix = " ".join(p[:i])
            suffix = " ".join(p[i:])
            results = self.acs["hg19"].get_suggestions(suffix) + self.acs["mm10"].get_suggestions(suffix)
            if len(results) > 0:
                results = sorted([prefix + " " + x for x in results])
                break
        return results

class Autocompleter:
    def __init__(self, ps, assembly):
        self.assembly = assembly
        self.ps = ps

    def get_suggestions(self, q):
        uq = q.lower()
        if not uq:
            return []

        tableName = self.assembly + "_autocomplete"
        with getcursor(self.ps.DBCONN, "Autocomplete::get_suggestions") as curs:
            # http://grokbase.com/t/postgresql/psycopg/125w8zab05/how-do-i-use-parameterized-queries-with-like
            curs.execute("""
SELECT DISTINCT(oname)
FROM {tn}
WHERE name LIKE %s || '%%'
LIMIT 10
            """.format(tn = tableName), (uq,))
            r = curs.fetchall()
        if not r:
            print("no results for %s in %s" % (uq, self.assembly))
            return []
        return [x[0] for x in r]


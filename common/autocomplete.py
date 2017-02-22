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
            results = list(set(self.acs["hg19"].get_suggestions(suffix) +
                               self.acs["mm10"].get_suggestions(suffix)))
            if len(results) > 0:
                results = [prefix + " " + x for x in results if "|" not in x]
                break
        return results

class Autocompleter:
    def __init__(self, ps, assembly):
        self.assembly = assembly
        self.ps = ps
        self.indices = {"misc": self.get_misc_suggestions,
                        "gene_aliases": self.get_gene_suggestions,
                        "snp_aliases": self.get_snp_suggestions,
                        "tfs": self.get_tf_suggestions,
                        "cell_types": self.get_celltype_suggestions }
        self.tfs = [] # TODO: fixme! self.es.get_tf_list()
        self.misc_dict = ["promoter", "enhancer", "DNase"]

    def recognizes_index(self, index):
        return index in self.indices

    def get_celltype_suggestions(self, q):
        query = or_query()
        query.append({"match_phrase_prefix": {"cell_type": q}})
        raw_results = self.es.search(index = "cell_types", body = query.query_obj)
        if raw_results["hits"]["total"] > 0:
            return [x["_source"]["cell_type"].replace("_", " ") for x in raw_results["hits"]["hits"]]
        return self.es.cell_type_query(q)

    def get_suggestions(self, q):
        uq = q.lower()
        if not uq:
            return []

        tableName = self.assembly + "_autocomplete"
        with getcursor(self.ps.DBCONN,
                       "autocomplete$Autocomplete::get_suggestions") as curs:
            curs.execute("""
SELECT oname 
FROM {tn}
WHERE name LIKE '{q}%' 
LIMIT 10
""".format(tn = tableName, q=uq))
            r = curs.fetchall()
        if not r:
            print("no results for %s in %s" % (uq, self.assembly))
        return [] if not r else [x[0] for x in r]


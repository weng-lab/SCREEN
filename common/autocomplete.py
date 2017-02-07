from elastic_search_wrapper import or_query, _gene_alias_fields

def _second_onward(arr):
    if len(arr) == 1: return []
    return arr[1:]

class AutocompleterWrapper:
    def __init__(self, ps):
        self.acs = {
            "hg19" : Autocompleter(ps["hg19"], "hg19"),
            "mm10" : Autocompleter(ps["mm10"], "mm10")}

    def __getitem__(self, assembly):
        return self.acs[assembly]
    def get_suggestions(self, q):
        return self.acs["hg19"].get_suggestions(q) + self.acs["mm10"].get_suggestions(q)

class Autocompleter:
    def __init__(self, ps, assembly):
        self.es = es
        self.assembly = assembly
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

    def get_suggestions(self, j):
        uq = j["userQuery"].lower()
        ret = self.get_gene_suggestions(uq) + self.get_snp_suggestions(uq)
        return { "results" : ret }

    def get_misc_suggestions(self, q):
        retval = []
        for item in self.misc_dict:
            if item.startswith(q): retval.append(item)
        return retval

    def get_tf_suggestions(self, q):
        q = q.lower()
        return filter(lambda x: x.startswith(q), self.tfs)

    def get_gene_suggestions(self, q):
        return []

    def _process_gene_suggestions(self, raw_results, q):
        retval = []
        for result in raw_results["hits"]["hits"]:
            for field in _gene_alias_fields:
                if q in result["_source"][field]:
                    retval.append(result["_source"][field])
        return retval

    def get_snp_suggestions(self, q):
        return []

    def _process_snp_suggestions(self, raw_results, q):
        retval = []
        for result in raw_results["hits"]["hits"]:
            if q in result["_source"]["accession"]:
                retval.append(result["_source"]["accession"])
        return retval

    def tf_list(self):
        return sorted(self.get_suggestions({"userQuery": "",
                                            "indices": "tfs" })["results"])

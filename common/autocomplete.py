from elastic_search_wrapper import or_query, _gene_alias_fields

def _second_onward(arr):
    if len(arr) == 1: return []
    return arr[1:]

class AutocompleterWrapper:
    def __init__(self, es):
        self.acs = {
            "hg19" : Autocompleter(es, "hg19"),
            "mm10" : Autocompleter(es, "mm10")}

    def __getitem__(self, assembly):
        return self.acs[assembly]

class Autocompleter:
    def __init__(self, es, assembly):
        self.es = es
        self.assembly = assembly
        self.indices = {"misc": self.get_misc_suggestions,
                        "gene_aliases": self.get_gene_suggestions,
                        "snp_aliases": self.get_snp_suggestions,
                        "tfs": self.get_tf_suggestions,
                        "cell_types": self.get_celltype_suggestions }
        self.tfs = self.es.get_tf_list()
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
        _uq = j["userQuery"].split(" ") #.lower()
        ret = []
        prefix = ""
        while len(_uq) > 0 and len(ret) == 0:
            uq = " ".join(_uq)
            counter = 0
            for k, v in self.indices.iteritems():
                if "indices" in j and k not in j["indices"]: continue
                for item in v(uq):
                    item = prefix + item
                    if 0:
                        ret.append({"name" : item,
                                    "value" : counter})
                    else:
                        ret.append(item)
                    counter += 1
            prefix += _uq[0] + " "
            _uq = _second_onward(_uq)
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
        query = or_query()
        for field in _gene_alias_fields:
            query.append({"match_phrase_prefix": {field: q}})
        raw_results = self.es.search(index = "gene_aliases",
                                     body = query.query_obj)
        if raw_results["hits"]["total"] > 0:
            return self._process_gene_suggestions(raw_results, q)
        query.reset()
        return []

    def _process_gene_suggestions(self, raw_results, q):
        retval = []
        for result in raw_results["hits"]["hits"]:
            for field in _gene_alias_fields:
                if q in result["_source"][field]:
                    retval.append(result["_source"][field])
        return retval

    def get_snp_suggestions(self, q):
        query = or_query()
        query.append({"match_phrase_prefix": {"accession": q}})
        raw_results = self.es.search(index = "snp_aliases",
                                     body = query.query_obj)
        if raw_results["hits"]["total"] > 0:
            return self._process_snp_suggestions(raw_results, q)
        query.reset()
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

from elastic_search_wrapper import or_query, _gene_alias_fields

class Autocompleter:

    def __init__(self, es):
        self.es = es
        self.indicies = {"gene_aliases": self.get_gene_suggestions,
                         "snp_aliases": self.get_snp_suggestions}

    def recognizes_index(self, index):
        return index in self.indicies
        
    def get_suggestions(self, userQuery):
        ret = []
        counter = 0
        for k, v in self.indicies.iteritems():
            for item in v(userQuery):
                ret.append({"name" : item,
                            "value" : counter})
                counter += 1
        return { "results" : ret }
        
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

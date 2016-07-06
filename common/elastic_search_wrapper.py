import requests
import json
import elasticsearch

get_headers = {}
put_headers = {}

default_server = "127.0.0.1"
default_port   = 9200

regelm_settings = {"settings":
                   { "analysis" : {
                       "analyzer" : {
                           "default" : {
                               "tokenizer" : "whitespace",
                               "filter" : ["lowercase"] } } } } }

_base_aggregations = {
    "chromosome": {"terms": {"field": "position.chrom"}},
    "start": {"histogram": {"field": "position.start",
			    "interval": 2000000,
			    "min_doc_count": 1}},
    "end": {"histogram": {"field": "position.end",
			  "interval": 2000000,
			  "min_doc_count": 1}},
    "gene_distance": {"histogram": {"field": "genes.nearest-all.distance",
				    "interval": 50000,
				    "min_doc_count": 1}},
    "pcgene_distance": {"histogram": {"field": "genes.nearest-pc.distance",
				      "interval": 50000,
				      "min_doc_count": 1}},
    "cell_lines": {"terms": {"field": "ranks.dnase"}} }

_textsearch_fields = ["genes.nearest-all.gene-id",
                      "genes.nearest-pc.gene-id",
                      "genome",
                      "position.chrom" ]

_or_query = {"query": {"bool": {"should": [] }}}

_gene_alias_fields = ["approved_symbol", "approved_name", "UniProt_ID", "Vega_ID",
                      "UCSC_ID", "RefSeq_ID"]

class or_query:
    basequery = {"query": {"bool": {"should": [] }}}

    def __init__(self):
        self.query_obj = dict(or_query.basequery)

    def append_fuzzy_match(self, field, value, fuzziness=1):
        self.query_obj["query"]["bool"]["should"].append({"match": {field: {"fuzziness": fuzziness,
                                                                            "query": value,
                                                                            "operator": "and" }}})

    def append_exact_match(self, field, value):
        self.query_obj["query"]["bool"]["should"].append({"match": {field: value}})

    def reset(self):
        self.query_obj["query"]["bool"]["should"] = []
        

class ElasticSearchWrapper:

    def __init__(self, es):
        self.es = es
        self.search = self.es.search

    @staticmethod
    def default_url(uri):
        return "http://%s:%d/%s" % (default_server, default_port, uri)
    
    @staticmethod
    def index(fnp, url):
        with open(fnp, "rb") as f:
            data = json.loads(f.read())
        return requests.put(url, headers=put_headers, data=json.dumps(data))

    @staticmethod
    def query(q, url):
        if q is None: return None
        return requests.get(url, headers=get_headers, data=json.dumps(q))

    def get_field_mapping(self, index, doc_type, field):
        path = field.split(".")
        result = requests.get(ElasticSearchWrapper.default_url("%s/_mapping/%s" % (index, doc_type)))
        result = json.loads(result.content)[index]["mappings"][doc_type]["properties"]
        for subfield in path:
            if subfield in result and "properties" in result[subfield]:
                result = result[subfield]["properties"]
            else:
                result = None
                break
        return {"type": "enumeration",
                "datapairs": [(k, -1) for k, v in result.iteritems()] if result is not None else [] }
    
    def get_cell_line_list(self):
        jobj = self.es.get_field_mapping(index="regulatory_elements", doc_type="element", field="ranks.dnase")
        return [k for k, v in jobj.iteritems()]

    def run_gene_query(self, fields, q, fuzziness, field_to_return=""):
        query = or_query()
        query.reset()
        for field in fields:
            query.append_fuzzy_match(field, q, fuzziness=fuzziness)
        raw_results = self.es.search(index = "gene_aliases", body = query.query_obj)
        if raw_results["hits"]["total"] <= 0: return ([], [])
        if field_to_return != "":
            results = [r["_source"][field_to_return] for r in raw_results["hits"]["hits"]]
        else:
            results = [r["_source"] for r in raw_results["hits"]["hits"]]
        return ([r for r in raw_results["hits"]["hits"] if r["_source"]["approved_symbol"] not in q],
                results)

    def gene_aliases_to_coordinates(self, q):
        suggestions, raw_results = self.run_gene_query(_gene_alias_fields, q, 0)
        if len(raw_results) == 0: return q
        for field in _gene_alias_fields:
            q = q.replace(raw_results[field], raw_results["coordinates"])
        return q
    
    def resolve_gene_aliases(self, q):
        
        # first round: exact matches on any of the IDs or the friendly name
        suggestions, raw_results = self.run_gene_query(_gene_alias_fields, q, 0, "ensemblid")
        if raw_results["hits"]["total"] > 0:
            return (suggestions, raw_results)

        # second round: symbol only, fuzziness 1
        suggestions, raw_results = self.run_gene_query(["approved_symbol"], q, 1, "ensemblid")
        if raw_results["hits"]["total"] > 0:
            return (suggestions, raw_results)
        
        # third round: fuzzy matches, fuzziness 1
        suggestions, raw_results = self.run_gene_query(_gene_alias_fields, q, 1, "ensemblid")
        if raw_results["hits"]["total"] > 0:
            return ([], raw_results) # the suggestions list will likely be too long to display for this query

        # fourth round: fuzzy matches, fuzziness 2
        suggestions, raw_results = self.run_gene_query(_gene_alias_fields, q, 2, "ensemblid")
        if raw_results["hits"]["total"] > 0:
            return ([], raw_results)

        return ([], [])
        
    def build_from_usersearch(self, q):
        retval = {"aggs": _base_aggregations,
                  "query": {"bool": {"should": []}}}
        suggestions, gene_ids = self.resolve_gene_aliases(q)
        parts = q.split(" ")
        for field in _textsearch_fields:
            retval["query"]["bool"]["should"].append({"match": {field: str(q)}})
        for term in parts:
            retval["query"]["bool"]["should"].append({"exists": {"field": "ranks.dnase." + term}})
        for gene_id in [str(g) for g in gene_ids]:
            retval["query"]["bool"]["should"].append({"match_phrase_prefix": {"genes.nearest-all.gene-id": gene_id}})
            retval["query"]["bool"]["should"].append({"match_phrase_prefix": {"genes.nearest-pc.gene-id": gene_id}})
        return (suggestions, retval)

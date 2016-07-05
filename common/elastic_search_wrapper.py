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

_fuzzy_gene_search = {"query":
                      {"bool":
                       {"match": {"_all": {"fuzziness": 1,
                                                   "query": "",
                                                   "operator": "and" }}}}}

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
    
    def resolve_gene_aliases(self, q):
        query = dict(_fuzzy_gene_search)
        query["query"]["match"]["_all"]["query"] = q
        print(query)
        raw_results = self.es.search(index = "gene_aliases", body = query)
        if raw_results["hits"]["total"] == 0: return []
        return [raw_results["hits"]["hits"][0]["_source"]["ensemblid"]]

    def build_from_usersearch(self, q):
        retval = {"aggs": _base_aggregations,
                  "query": {"bool": {"should": []}}}
        gene_ids = self.resolve_gene_aliases(q)
        parts = q.split(" ")
        for field in _textsearch_fields:
            retval["query"]["bool"]["should"].append({"match": {field: str(q)}})
        for term in parts:
            retval["query"]["bool"]["should"].append({"exists": {"field": "ranks.dnase." + term}})
        for gene_id in [str(g) for g in gene_ids]:
            retval["query"]["bool"]["should"].append({"match_phrase_prefix": {"genes.nearest-all.gene-id": gene_id}})
            retval["query"]["bool"]["should"].append({"match_phrase_prefix": {"genes.nearest-pc.gene-id": gene_id}})
        return retval

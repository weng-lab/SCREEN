import sys, os
import requests
import json
import elasticsearch
from copy import copy

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from constants import paths

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

_gene_alias_fields = ["approved_symbol", "approved_name", "UniProt_ID", "Vega_ID",
                      "UCSC_ID", "RefSeq_ID"]

class or_query:

    def __init__(self):
        self.query_obj = {"query": {"bool": {"should": [] }}}

    def append_fuzzy_match(self, field, value, fuzziness=1):
        self.query_obj["query"]["bool"]["should"].append({"match": {field: {"fuzziness": fuzziness,
                                                                            "query": value,
                                                                            "operator": "and" }}})

    def append_exact_match(self, field, value):
        self.query_obj["query"]["bool"]["should"].append({"match": {field: value}})

    def append(self, obj):
        self.query_obj["query"]["bool"]["should"].append(obj)

    def reset(self):
        self.query_obj["query"]["bool"]["should"] = []

class and_query:

    def __init__(self):
        self.query_obj = {"query": {"bool": {"must": [] }}}

    def append_fuzzy_match(self, field, value, fuzziness=1):
        self.query_obj["query"]["bool"]["must"].append({"match": {field: {"fuzziness": fuzziness,
                                                                          "query": value,
                                                                          "operator": "and" }}})

    def append_exact_match(self, field, value):
        self.query_obj["query"]["bool"]["must"].append({"match": {field: value}})

    def reset(self):
        self.query_obj["query"]["bool"]["must"] = []

    def append(self, obj):
        self.query_obj["query"]["bool"]["must"].append(obj)

class terms_aggregation:
    def __init__(self, size = 0):
        self.query_obj = {"aggs": {}}
        self.size = size

    def append(self, name, term):
        self.query_obj["aggs"][name] = {"terms": {"field": term, "size": self.size}}

def snp_query(accession, assembly="", fuzziness=0):
    retval = copy(_snp_query)
    if assembly != "":
        retval.query.bool.must.assembly = assembly
    else:
        retval.query.bool.must.remove
    retval.query.bool.must.accession = accession
    return retval

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

    def genes_from_ensemblids(self, ensembl_ids):
        query = []
        for ensembl_id in ensembl_ids:
            query.append({"match": {"ensemblid": ensembl_id.split(".")[0]}})
        retval = self.es.search(body={"query": {"bool": {"should": query}},
                                      "size": 1000},
                                index="gene_aliases")["hits"]["hits"]
        return [x["_source"] for x in retval]
    
    def _find_within(self, q, rf):
        _tk = q.split(" ")
        retval = []
        while len(retval) == 0:
            retval = rf(" ".join(_tk))
            if len(_tk) == 1: break
            _tk = _tk[1:]
        _tk = q.split(" ")[:-1]
        if len(_tk) == 0: return retval
        while len(retval) == 0:
            retval = rf(" ".join(_tk))
            if len(_tk) == 1: break
            _tk = _tk[:-1]
        return retval

    def _suggest_within(self, q, rf):
        _tk = q.split(" ")
        retval = []
        while len(retval) == 0:
            s, retval = rf(" ".join(_tk))
            if len(_tk) == 1: break
            _tk = _tk[1:]
        _tk = q.split(" ")[:-1]
        if len(_tk) == 0: return (s, retval)
        while len(retval) == 0:
            s, retval = rf(" ".join(_tk))
            if len(_tk) == 1: break
            _tk = _tk[:-1]
        return (s, retval)
    
    def get_tf_list(self):
        results = []
        query = terms_aggregation()
        query.append("tf", "label")
        raw_results = self.es.search(index="peak_beds", body=query.query_obj)
        for bucket in raw_results["aggregations"]["tf"]["buckets"]:
            results.append(bucket["key"])
        return results
    
    def get_bed_list(self, acc_list):
        query = or_query()
        for acc in acc_list:
            query.append_exact_match("accession", acc)
        query.query_obj["size"] = 10000
        return self.es.search(index="peak_beds", body=query.query_obj)

    def _get_overlaps_generic(self, coord, index):
        query = and_query()
        query.append_exact_match("position.chrom", coord["chrom"])
        query.append({"range": {"position.start": {"gte": coord["start"]}}})
        query.append({"range": {"position.end": {"lte": coord["end"]}}})
        return self.es.search(index=index, body=query.query_obj)

    def get_overlapping_snps(self, coord, assembly):
        index = "snp_aliases"
        query = and_query()
        query.append_exact_match("assembly", assembly)
        query.append_exact_match("position.chrom", coord["chrom"])
        query.append({"range": {"position.start": {"gte": coord["start"]}}})
        query.append({"range": {"position.end": {"lte": coord["end"]}}})
        return self.es.search(index=index, body=query.query_obj)

    def cell_type_query(self, q):
        return self._find_within(q, self._cell_type_query)
    
    def _cell_type_query(self, q):
        query = or_query()
        query.append_fuzzy_match("cell_type", q.replace(" ", "_"), fuzziness=1)
        raw_results = self.es.search(index = "cell_types", body = query.query_obj)
        return [x["_source"]["cell_type"].replace("_", " ") for x in raw_results["hits"]["hits"]]
    
    def get_overlapping_res(self, coord):
        return self._get_overlaps_generic(coord, paths.re_json_index)

    def get_overlapping_genes(self, coord):
        return self._get_overlaps_generic(coord, "gene_aliases")

    def get_field_mapping(self, index, doc_type, field):
        path = field.split(".")
        url = os.path.join(index, "_mapping", doc_type)

        print(url)
        result = requests.get(ElasticSearchWrapper.default_url(url))

        print(result.content)
        
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
        jobj = self.es.get_field_mapping(index=paths.re_json_index,
                                         doc_type="element", field="ranks.dnase")
        return [k for k, v in jobj.iteritems()]

    def gene_aliases_to_coordinates(self, q):
        suggestions, raw_results = self._suggest_within(q, self.resolve_gene_aliases)
        retval = []
        if len(raw_results) == 0: return (suggestions, retval)
        for field in _gene_alias_fields:
            for result in raw_results:
                if result[field].strip() != '' and result[field] in q and "coordinates" in result:
                    retval.append((result[field], result["coordinates"]))
        return (suggestions, retval)

    def snp_aliases_to_coordinates(self, q):
        suggestions, raw_results = self.resolve_snp_aliases(q)
        retval = []
        if len(raw_results) == 0:
            return (suggestions, retval)
        for result in raw_results:
            if result["accession"] in q:
                pos = result["position"]
                coordinates = "%s:%s-%s" % (pos["chrom"], pos["start"], pos["end"])
                retval.append((result["accession"], coordinates))
        return (suggestions, retval)

    def run_gene_query(self, fields, q, fuzziness, field_to_return=""):
        query = or_query()
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

    def run_snp_query(self, q, fuzziness, assembly="", field_to_return=""):
        query = and_query()
        if assembly != "":
            query.append_exact_match("assembly", assembly)
        query.append_fuzzy_match("accession", q, fuzziness=fuzziness)
        raw_results = self.es.search(index = "snp_aliases", body = query.query_obj)
        if raw_results["hits"]["total"] <= 0: return ([], [])
        if field_to_return != "":
            results = [r["_source"][field_to_return] for r in raw_results["hits"]["hits"]]
        else:
            results = [r["_source"] for r in raw_results["hits"]["hits"]]
        return ([r for r in raw_results["hits"]["hits"] if r["_source"]["accession"] not in q],
                results)

    def resolve_gene_aliases(self, q):
        # first round: exact matches on any of the IDs or the friendly name
        suggestions, results = self.run_gene_query(_gene_alias_fields, q, 0)
        if len(results) > 0:
            return (suggestions, results)

        # second round: symbol only, fuzziness 1
        suggestions, results = self.run_gene_query(["approved_symbol"], q, 1)
        if len(results) > 0:
            return (suggestions, results)

        # third round: fuzzy matches, fuzziness 1
        suggestions, raw_results = self.run_gene_query(_gene_alias_fields, q, 1)
        if len(results) > 0:
            return ([], results) # the suggestions list will likely be too long to display for this query

        # fourth round: fuzzy matches, fuzziness 2
        suggestions, raw_results = self.run_gene_query(_gene_alias_fields, q, 2)
        if len(results) > 0:
            return ([], results)

        return ([], [])

    def resolve_snp_aliases(self, q):
        for i in range(0, 3):
            suggestions, results = self.run_snp_query(q, i)
            if len(results) > 0:
                return (suggestions, results)
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

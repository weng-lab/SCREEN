#!/usr/bin/env python

import os, sys, json
import argparse

from twisted.python import log
from twisted.internet import reactor

import psycopg2, psycopg2.pool

import autoreload

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from elastic_search_wrapper import ElasticSearchWrapper
from postgres_wrapper import PostgresWrapper

from elasticsearch import Elasticsearch
from autocomplete import Autocompleter

from autobahn.twisted.websocket import WebSocketServerProtocol, WebSocketServerFactory

from models.regelm import RegElements
from models.regelm_detail import RegElementDetails
from models.expression_matrix import ExpressionMatrix

from dbs import DBS

# from https://github.com/crossbario/autobahn-python/blob/master/examples/twisted/websocket/echo/server.py

cmap = {"regulatory_elements": RegElements,
        "expression_matrix": ExpressionMatrix}

class MyServerProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")

    def _get_and_send_re_detail(self, j):
        global details

        output = {"type": "re_details",
                  "q": {"accession": j["accession"],
                        "position": j["coord"]} }

        expanded_coords = {"chrom": j["coord"]["chrom"],
                           "start": j["coord"]["start"] - 10000000,
                           "end": j["coord"]["end"] + 10000000}
        
        snp_results = es.get_overlapping_snps(j["coord"])
        gene_results = es.get_overlapping_genes(expanded_coords)
        re_results = es.get_overlapping_res(expanded_coords)
        
        output["overlapping_snps"] = details.format_snps_for_javascript(snp_results, j["coord"])
        output["nearby_genes"] = details.format_genes_for_javascript(gene_results, j["coord"])
        output["nearby_res"] = details.format_res_for_javascript(re_results, j["coord"], j["accession"])
        
        self.sendMessage(json.dumps(output))

    def _get_and_send_peaks_detail(self, j):
        global details
        output = {"type": "peak_details",
                  "q": {"accession": j["accession"],
                        "position": j["coord"]} }
        bed_accs = details.get_intersecting_beds(j["accession"])
        output["peak_results"] = details.get_bed_stats(bed_accs)
        self.sendMessage(json.dumps(output))

    def _suggest(self, j):
        ret = {"type": "suggestions",
                  "callback": j["callback"]}
        ret.update(ac.get_suggestions(j["userQuery"]))
        self.sendMessage(json.dumps(ret))

    def onMessage(self, payload, isBinary):
        if isBinary:
            self.sendMessage("not supported", False)
            return

        try:
            payload = payload.decode('utf8')
            j = json.loads(payload)
            regElements = RegElements(es)

            if "action" in j:
                if j["action"] == "enumerate":
                    raw_results = es.get_field_mapping(index=j["index"], doc_type=j["doc_type"], field=j["field"])
                    raw_results.update({"name": j["name"]})
                    self.sendMessage(json.dumps(raw_results))
                    return
                if j["action"] == "re_detail":
                    self._get_and_send_re_detail(j)
                    return
                elif j["action"] == "peak_detail":
                    self._get_and_send_peaks_detail(j)
                    return
                if j["action"] == "suggest":
                    self._suggest(j)
                    return
                if j["action"] == "query":
                    raw_results = es.search(body=j["object"], index=j["index"])
                    if j["callback"] in cmap:
                        processed_results = cmap[j["callback"]].process_for_javascript(raw_results)
                    else:
                        processed_results = raw_results
                    processed_results["callback"] = j["callback"]
                    self.sendMessage(json.dumps(processed_results))
                    return

            ret = regElements.overlap(j["chrom"], int(j["start"]), int(j["end"]))

        except:
            raise
            ret = { "status" : "error",
                    "err" : 1}

        self.sendMessage(json.dumps(ret), False)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dev', action="store_true", default=False)
    parser.add_argument('--port', default=9000, type=int)
    parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
    parser.add_argument('--elasticsearch_port', type=int, default=9200)
    parser.add_argument('--local', action="store_true", default=False)
    return parser.parse_args()

def myMain():
    log.startLogging(sys.stdout)

    global es, ac, ps, details

    args = parse_args()

    es = ElasticSearchWrapper(Elasticsearch())
    ac = Autocompleter(es)
    
    if args.local:
        dbs = DBS.localRegElmViz()
    else:
        dbs = DBS.pgdsn("regElmViz")
        dbs["application_name"] = os.path.realpath(__file__)

    DBCONN = psycopg2.pool.ThreadedConnectionPool(1, 32, **dbs)
    ps = PostgresWrapper(DBCONN)
    details = RegElementDetails(es, ps)

    factory = WebSocketServerFactory("ws://127.0.0.1:" + str(args.port))
    factory.protocol = MyServerProtocol
    factory.setProtocolOptions(maxConnections=50)

    reactor.listenTCP(args.port, factory)
    reactor.run()

def main():
    # from https://gist.github.com/motleytech/8f255193f613c6623c19d3f93c01cbed
    autoreload.main(myMain)

if __name__ == '__main__':
    sys.exit(main())

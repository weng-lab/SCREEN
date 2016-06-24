#!/usr/bin/env python

import sys, json

from twisted.python import log
from twisted.internet import reactor

from elasticsearch import Elasticsearch

from autobahn.twisted.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory

from models.regelm import RegElements

# from https://github.com/crossbario/autobahn-python/blob/master/examples/twisted/websocket/echo/server.py

es = Elasticsearch()

class MyServerProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")

    def onMessage(self, payload, isBinary):
        if isBinary:
            self.sendMessage("not supported", False)
            return

        payload = payload.decode('utf8')
        j = json.loads(payload)

        regElements = RegElements(es)

        if "aggs" in j and "query" in j:
            raw_results = es.search(body=j, index="regulatory_elements2")
            processed_results = RegElements.process_for_javascript(raw_results)
            self.sendMessage(json.dumps(processed_results))
            return
        
        try:
            ret = regElements.overlap(j["chrom"], int(j["start"]), int(j["end"]))
        except:
            ret = { "status" : "",
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
    return parser.parse_args()

def main():
    log.startLogging(sys.stdout)

    factory = WebSocketServerFactory(u"ws://127.0.0.1:9000")
    factory.protocol = MyServerProtocol
    # factory.setProtocolOptions(maxConnections=2)

    reactor.listenTCP(9000, factory)
    reactor.run()

if __name__ == '__main__':
    sys.exit(main())

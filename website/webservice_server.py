#!/usr/bin/env python

import sys, json

from twisted.python import log
from twisted.internet import reactor

from autobahn.twisted.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory

# from https://github.com/crossbario/autobahn-python/blob/master/examples/twisted/websocket/echo/server.py

class MyServerProtocol(WebSocketServerProtocol):

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")

    def onMessage(self, payload, isBinary):
        if isBinary:
            raise Exception("not supported")

        print("Text message received: {0}".format(payload.decode('utf8')))
        ret = { "status" : "",
                "err" : 1}
        self.sendMessage(json.dumps(ret), False)

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))

def main():
    log.startLogging(sys.stdout)

    factory = WebSocketServerFactory(u"ws://127.0.0.1:9000")
    factory.protocol = MyServerProtocol
    # factory.setProtocolOptions(maxConnections=2)

    reactor.listenTCP(9000, factory)
    reactor.run()

if __name__ == '__main__':
    sys.exit(main())

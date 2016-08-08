#!/usr/bin/python

import cherrypy, os, sys, argparse

from elasticsearch import Elasticsearch
import psycopg2, psycopg2.pool

from app_main import MainAppRunner
from app_ui import UiAppRunner

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from elastic_search_wrapper import ElasticSearchWrapper
from postgres_wrapper import PostgresWrapper

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates
from utils import Utils
from dbs import DBS

class RegElmVizWebsite(object):
    # from http://stackoverflow.com/a/15015705

    def __init__(self, args):
        self.args = args
        self.devMode = self.args.dev
        self.port = self.args.port

        cacheDir = os.path.realpath(os.path.join(os.path.dirname(__file__),
                                                 "cache"))
        Utils.mkdir_p(cacheDir)

        cherrypy.config.update({
                'server.socket_host': '0.0.0.0',
                'server.socket_port': self.port,
                'tools.sessions.on': True,
                'tools.sessions.storage_type': "file",
                'tools.sessions.storage_path': cacheDir,
                'tools.sessions.locking': 'early',
                })

        webSocketUrl = '"ws://" + window.location.hostname + ":{websocket_port}"'.format(websocket_port=args.websocket_port)
        if not self.devMode:
            webSocketUrl = "ws://bib7.umassmed.edu/regElmViz/ws/";

        self.es = ElasticSearchWrapper(Elasticsearch())

        if args.local:
            dbs = DBS.localRegElmViz()
        else:
            dbs = DBS.pgdsn("regElmViz")
            dbs["application_name"] = os.path.realpath(__file__)
        self.DBCONN = psycopg2.pool.ThreadedConnectionPool(1, 32, **dbs)
        self.ps = PostgresWrapper(self.DBCONN)

        MainAppRunner(self.es, self.ps, self.devMode, webSocketUrl)
        UiAppRunner(self.es, self.ps, self.devMode, webSocketUrl)
        
    def start(self):
        if self.devMode:
            cherrypy.config.update({'server.environment': "development", })
        else:
            cherrypy.config.update({'server.socket_queue_size': 512,
                                    'server.thread_pool': 30
                                    })

        cherrypy.engine.start()
        cherrypy.engine.block()

    def stop(self):
        cherrypy.engine.stop()

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dev', action="store_false")
    parser.add_argument('--production', action="store_true")
    parser.add_argument('--local', action="store_true", default=False)
    parser.add_argument('--port', default=8000, type=int)
    parser.add_argument('--websocket_port', default=9000, type=int)
    parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
    parser.add_argument('--elasticsearch_port', type=int, default=9200)
    return parser.parse_args()

def main():
    args = parse_args()
    if args.production:
        args.dev = False
    print(args.dev)

    RegElmVizWebsite(args).start()

if __name__ == "__main__":
    sys.exit(main())

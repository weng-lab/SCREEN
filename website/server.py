#!/usr/bin/python

import cherrypy, os, sys, argparse

import psycopg2, psycopg2.pool
from elasticsearch import Elasticsearch

from app_main import MainAppRunner

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates
from dbs import DBS
from utils import Utils

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

        self.es = Elasticsearch([args.elasticsearch_server],
                                port = args.elasticsearch_port)
        MainAppRunner(self.es, self.devMode)

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
    parser.add_argument('--dev', action="store_true", default=False)
    parser.add_argument('--port', default=8000, type=int)
    parser.add_argument("--elasticsearch_server", type=str, default="127.0.0.1")
    parser.add_argument('--elasticsearch_port', type=int, default=9200)
    return parser.parse_args()

def main():
    args = parse_args()
    RegElmVizWebsite(args).start()

if __name__ == "__main__":
    sys.exit(main())

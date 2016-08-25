#!/usr/bin/env python

import cherrypy, os, sys, argparse, time

from elasticsearch import Elasticsearch
import psycopg2, psycopg2.pool

from app_main import MainApp
from app_ui import UiAppRunner

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from elastic_search_wrapper import ElasticSearchWrapper
from postgres_wrapper import PostgresWrapper
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates
from utils import Utils
from dbs import DBS

def CORS():
    cherrypy.response.headers["Access-Control-Allow-Origin"] = "*"
    cherrypy.response.headers["Access-Control-Allow-Headers"] = "content-type, Authorization, X-Requested-With"
    cherrypy.response.headers["Access-Control-Allow-Methods"] = 'GET, POST'

class Config:
    def __init__(self, siteName):
        self.siteName = siteName
        self.root = os.path.realpath(os.path.dirname(__file__))
        self.tmpDir = os.path.join(self.root, "tmp")

        # shared sessions
        self.sessionDir = os.path.join(self.tmpDir, "sessions")
        Utils.mkdir_p(self.sessionDir)

        self.logDir = os.path.join(self.tmpDir, "logs", siteName)
        Utils.mkdir_p(self.logDir)

        # http://stackoverflow.com/a/10607768
        ts = time.strftime("%Y%m%d-%H%M%S")
        self.accessFnp = os.path.join(self.logDir,
                                      "access-" + ts + ".log")
        self.errorFnp = os.path.join(self.logDir,
                                     "error-" + ts + ".log")

        self.staticDir = os.path.join(self.root, "static")
        self.viewDir = os.path.join(self.root, "views")

    def getRootConfig(self):
        return {
            '/': {
                'tools.CORS.on' : True,
                'tools.sessions.on' : True,
                'tools.sessions.timeout' : 60000,
                'tools.sessions.storage_type' : "file",
                'tools.sessions.storage_path' : self.sessionDir,
                'log.access_file' : self.accessFnp,
                'log.error_file' : self.errorFnp,
                'log.screen' : False,
            },
            '/static' : {
                'tools.staticdir.on' : True,
                'tools.staticdir.dir' : self.staticDir
                }
        }

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
            webSocketUrl = '"ws://bib7.umassmed.edu/regElmViz/ws/"';

        self.es = ElasticSearchWrapper(Elasticsearch())

        self.DBCONN = db_connect(os.path.realpath(__file__), args.local)
        self.ps = PostgresWrapper(self.DBCONN)

        MainAppRunner(self.es, self.ps, self.devMode, webSocketUrl, getRootConfig("main"))
        UiAppRunner(self.es, self.ps, self.devMode, webSocketUrl, getRootConfig("ui"))

    def start(self):
        if self.devMode:
            cherrypy.config.update({'server.environment': "development",
                                    'log.screen': True,})
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

    webSocketUrl = '"ws://" + window.location.hostname + ":%s"' % args.websocket_port
    if not args.dev:
        webSocketUrl = '"ws://" + window.location.hostname + "/ws/"';

    es = ElasticSearchWrapper(Elasticsearch())

    if args.local:
        dbs = DBS.localRegElmViz()
    else:
        dbs = DBS.pgdsn("RegElmViz")
    dbs["application_name"] = os.path.realpath(__file__)

    DBCONN = psycopg2.pool.ThreadedConnectionPool(1, 32, **dbs)
    ps = PostgresWrapper(DBCONN)

    config = Config("main")
    main = MainApp(config.viewDir, config.staticDir,
                   es, ps, webSocketUrl)
    cherrypy.tree.mount(main, '/', config.getRootConfig())
    cherrypy.tools.CORS = cherrypy.Tool('before_handler', CORS)

    if args.dev:
        cherrypy.config.update({'server.environment': "development", })
    cherrypy.config.update({'server.socket_host': '0.0.0.0', })
    cherrypy.config.update({'server.socket_port': int(args.port), })

    if not args.local:
        cherrypy.config.update({'server.socket_queue_size': 512})
        cherrypy.config.update({'server.thread_pool': 30})

    cherrypy.engine.start()
    cherrypy.engine.block()

if __name__ == "__main__":
    sys.exit(main())

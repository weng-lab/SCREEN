#!/usr/bin/env python

import cherrypy, os, sys, argparse, time

#from elasticsearch import Elasticsearch
import psycopg2, psycopg2.pool

# https://pypi.python.org/pypi/cherrys
import cherrys
cherrypy.lib.sessions.RedisSession = cherrys.RedisSession

from app_main import MainApp
from common.cached_objects import CachedObjectsWrapper

sys.path.append(os.path.join(os.path.dirname(__file__), "../common"))
from postgres_wrapper import PostgresWrapper
from dbconnect import db_connect

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates
from utils import Utils

class DummyEs:
    def search(self, index, body):
        return {"hits": {"total": 0, "hits": [] }}
    def __init__(self):
        pass

class Config:
    def __init__(self, siteName, production):
        self.siteName = siteName
        self.production = production

        self.root = os.path.realpath(os.path.dirname(__file__))

        import socket
        hn = socket.gethostname()
        self.tmpDir = os.path.join(self.root, "tmp", hn)

        self.logDir = os.path.join(self.tmpDir, "logs", siteName)
        Utils.mkdir_p(self.logDir)

        # http://stackoverflow.com/a/10607768
        ts = time.strftime("%Y%m%d-%H%M%S")
        self.errorFnp = os.path.join(self.logDir,
                                     "error-" + ts + ".log")

        self.staticDir = os.path.join(self.root, "static")
        self.viewDir = os.path.join(self.root, "views")

    def getRootConfig(self):
        redisHost = "127.0.0.1"
        if self.production:
            redisHost = "redis"

        return {
            '/': {
                'tools.sessions.on' : True,
                'tools.sessions.storage_type' : 'redis',
                'tools.sessions.host' : redisHost,
                'tools.sessions.locking' : 'explicit'
            },
            '/static' : {
                'tools.staticdir.on' : True,
                'tools.staticdir.dir' : self.staticDir
                }
        }

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dev', action="store_false")
    parser.add_argument('--dump', action="store_true", default=False)
    parser.add_argument('--production', action="store_true")
    parser.add_argument('--port', default=8000, type=int)
    return parser.parse_args()

def main():
    args = parse_args()
    if args.production:
        args.dev = False

    DBCONN = db_connect(os.path.realpath(__file__))
    ps = PostgresWrapper(DBCONN)
    cow = CachedObjectsWrapper(ps)

    config = Config("main", args.production)
    main = MainApp(args, config.viewDir, config.staticDir, ps, cow)
    cherrypy.tree.mount(main, '/', config.getRootConfig())

    if args.dev:
        cherrypy.config.update({'server.environment': "development", })
    cherrypy.config.update({'server.socket_host': '0.0.0.0',
                            'server.socket_port': int(args.port)})
    
    if args.production:
        cherrypy.config.update({'server.socket_queue_size': 512,
                                'server.thread_pool': 30,
                                'log.screen' : False,
                                'log.access_file' : "",
                                'log.error_file' : config.errorFnp
                                })
    cherrypy.engine.start()
    cherrypy.engine.block()

if __name__ == "__main__":
    sys.exit(main())

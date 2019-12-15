#!/usr/bin/env python3

from gevent import monkey
monkey.patch_all()

import cherrypy
import os
import sys
import argparse
import time
import socket
import psycopg2
import psycopg2.pool

from main_apis import Apis
from common.cached_objects import CachedObjectsWrapper

sys.path.append(os.path.join(os.path.dirname(__file__), "../utils"))
from templates import Templates
from utils import Utils, AddPath

AddPath(__file__, "../common")
from postgres_wrapper import PostgresWrapper
from dbconnect import db_connect
from config import Config

class WebServerConfig:
    def __init__(self, siteName, production):
        self.siteName = siteName
        self.production = production

        self.root = os.path.realpath(os.path.dirname(__file__))

        hn = socket.gethostname()
        self.tmpDir = os.path.join(self.root, "tmp", hn)

        self.logDir = os.path.join(self.tmpDir, "logs", siteName)
        Utils.mkdir_p(self.logDir)

        # http://stackoverflow.com/a/10607768
        ts = time.strftime("%Y%m%d-%H%M%S")
        self.errorFnp = os.path.join(self.logDir,
                                     "error-" + ts + ".log")

        self.staticDir = os.path.join(self.root, "assets")
        self.downloadDir = os.path.join(Config.downloadDir)
        self.viewDir = os.path.join(self.root, "views")

    def getRootConfig(self):
        return {
            '/': {
            },
            '/assets': {
                'tools.staticdir.on': True,
                'tools.staticdir.dir': self.staticDir
            },
            '/downloads': {
                'tools.staticdir.on': True,
                'tools.staticdir.dir': self.downloadDir
            }
        }


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dev', action="store_false")
    parser.add_argument('--dump', action="store_true", default=False)
    parser.add_argument('--debugger', action="store_false", default=False)
    parser.add_argument('--production', action="store_true")
    parser.add_argument('--port', default=9006, type=int)
    return parser.parse_args()


def main():
    args = parse_args()
    if args.production:
        args.dev = False

    DBCONN = db_connect(os.path.realpath(__file__))
    ps = PostgresWrapper(DBCONN)
    cow = CachedObjectsWrapper(ps)

    wsconfig = WebServerConfig("main", args.production)
    main = Apis(args, wsconfig.viewDir, wsconfig.staticDir, ps, cow)
    app = cherrypy.tree.mount(main, '/screen10', wsconfig.getRootConfig())

    cherrypy.config.update({'server.socket_host': '0.0.0.0',
                            'server.socket_port': int(args.port),
                            'tools.encode.text_only': False})

    if args.dev:
        cherrypy.config.update({'server.environment': "development",
                                'server.socket_queue_size': 128,
                                'server.thread_pool': 8,
        })

    if args.debugger:
        from wdb.ext import WdbMiddleware
        cherrypy.config.update({'global':{'request.throw_errors': True}})
        app.wsgiapp.pipeline.append(('debugger', WdbMiddleware))
        # to use:
        # import wdb
        # wdb.set_trace()

    if args.production:
        cherrypy.config.update({'server.socket_queue_size': 512,
                                'server.thread_pool': 30,
                                'log.screen': False,
                                'log.access_file': "",
                                'log.error_file': wsconfig.errorFnp
                                })
    cherrypy.engine.start()
    cherrypy.engine.block()


if __name__ == "__main__":
    sys.exit(main())

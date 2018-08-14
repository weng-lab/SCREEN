#!/usr/bin/env python2

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

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from templates import Templates
from utils import Utils, AddPath
from files_and_paths import Dirs

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
                'tools.staticdir.dir': self.staticDir #,
                #'tools.cors.on' : True,
            },
            '/downloads': {
                'tools.staticdir.on': True,
                'tools.staticdir.dir': self.downloadDir #,
                #'tools.cors.on' : True,
            }
        }


def cors():
    # from https://stackoverflow.com/a/28065698
    if cherrypy.request.method == 'OPTIONS':
        # preflign request
        # see http://www.w3.org/TR/cors/#cross-origin-request-with-preflight-0
        cherrypy.response.headers['Access-Control-Allow-Methods'] = 'POST'
        cherrypy.response.headers['Access-Control-Allow-Headers'] = 'content-type'
        cherrypy.response.headers['Access-Control-Allow-Origin'] = '*'
        # tell CherryPy no avoid normal handler
        return True
    else:
        cherrypy.response.headers['Access-Control-Allow-Origin'] = '*'


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--dev', action="store_false")
    parser.add_argument('--dump', action="store_true", default=False)
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

    args.basedir = Dirs.data_base
    wsconfig = WebServerConfig("main", args.production)
    main = Apis(args, wsconfig.viewDir, wsconfig.staticDir, ps, cow)
    cherrypy.tree.mount(main, '/', wsconfig.getRootConfig())

    # cherrypy.tools.cors = cherrypy._cptools.HandlerTool(cors)

    cherrypy.config.update({'server.socket_host': '0.0.0.0',
                            'server.socket_port': int(args.port)})

    if args.dev:
        cherrypy.config.update({'server.environment': "development",
                                'server.socket_queue_size': 128,
                                'server.thread_pool': 8,
        })

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

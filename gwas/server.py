#!/usr/bin/env python

import cherrypy, os, sys, argparse, time
import socket
import psycopg2, psycopg2.pool

from app_ld import SnpApp

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from templates import Templates
from utils import Utils, AddPath

AddPath(__file__, "../common")
from postgres_wrapper import PostgresWrapper
from dbconnect import db_connect

class WebServerConfig:
    def __init__(self, siteName):
        self.siteName = siteName

        self.root = os.path.realpath(os.path.dirname(__file__))

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
        return {
            '/': {
                },
            }

def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument('--port', default=9005, type=int)
    return parser.parse_args()

def main():
    args = parse_args()

    DBCONN = db_connect(os.path.realpath(__file__))
    ps = PostgresWrapper(DBCONN)

    wsconfig = WebServerConfig("snp")
    main = SnpApp(args, wsconfig.viewDir, wsconfig.staticDir, ps)
    cherrypy.tree.mount(main, '/', wsconfig.getRootConfig())

    cherrypy.config.update({'server.socket_host': '0.0.0.0',
                            'server.socket_port': int(args.port),
                            'server.socket_queue_size': 512,
                            'server.thread_pool': 30,
                            'log.screen' : True,
                            'log.access_file' : "",
                            'log.error_file' : wsconfig.errorFnp
                            })
    cherrypy.engine.start()
    cherrypy.engine.block()

if __name__ == "__main__":
    sys.exit(main())

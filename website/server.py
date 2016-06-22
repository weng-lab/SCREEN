#!/usr/bin/python

import cherrypy, os, sys, argparse

import psycopg2, psycopg2.pool

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates
from dbs import DBS

class RegElmVizWebsite(object):
    # from http://stackoverflow.com/a/15015705

    def __init__(self, args):
        self.args = args
        self.devMode = self.args.dev
        self.port = self.args.port

        cacheDir = os.path.realpath(os.path.join(os.path.dirname(__file__),
                                                 "cache"))

        cherrypy.config.update({
                'server.socket_host': '0.0.0.0',
                'server.socket_port': self.port,
                'tools.sessions.on': True,
                'tools.sessions.storage_type': "file",
                'tools.sessions.storage_path': cacheDir,
                'tools.sessions.locking': 'early',
                })

        
        # import after adding "protect" tool
        from app_main import MainAppRunner

        self.DBCONNs = {}
        for species in ["human", "mouse"]:
            dbs = None
            DBCONN = None #psycopg2.pool.ThreadedConnectionPool(1, 32, **dbs)
            self.DBCONNs[species] = DBCONN
            MainAppRunner(DBCONN, self.devMode, species)

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
    parser.add_argument('--audience', default="")
    parser.add_argument('--port', default=8000, type=int)
    return parser.parse_args()

def main():
    args = parse_args()
    RegElmVizWebsite(args).start()

if __name__ == "__main__":
    sys.exit(main())

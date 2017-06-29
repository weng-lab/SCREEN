import psycopg2.pool
import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from dbs import DBS
from utils import AddPath 

AddPath(__file__, "../")
from config import Config

# assumes .pgpass file, like http://stackoverflow.com/a/28801642
def getDbs(script):
    return {"host": Config.db_host,
            "user": Config.db_usr,
            "dbname": Config.db,
            "application_name" : script}

def db_connect(script):
    return psycopg2.pool.ThreadedConnectionPool(1, 32, **getDbs(script))

def db_connect_single(script):
    return psycopg2.connect(**getDbs(script))

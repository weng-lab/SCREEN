import psycopg2.pool
import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from dbs import DBS
from utils import AddPath 

AddPath(__file__, "../")
from config import Config

def db_connect(script):
    # assumes .pgpass file, like http://stackoverflow.com/a/28801642
    dbs = {"host": "postgresql",
           "user": "regElmViz_usr",
           "dbname": Config.database,
           "application_name" : script}
    return psycopg2.pool.ThreadedConnectionPool(1, 32, **dbs)

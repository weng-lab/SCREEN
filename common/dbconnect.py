import psycopg2.pool
import sys
import os

sys.path.append(os.path.join(os.path.dirname(__file__), "../"))
from config import Config

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)),
                             "../../metadata/utils"))
from dbs import DBS

def db_connect(script):
    dbs = {"host": "postgresql",
           "user": "regElmViz_usr",
           "dbname": Config.database,
           "application_name" : script}
    return psycopg2.pool.ThreadedConnectionPool(1, 32, **dbs)

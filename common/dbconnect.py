import psycopg2.pool
import sys
import os

sys.path.append(os.path.join(os.path.dirname(os.path.realpath(__file__)), "../../metadata/utils"))
from dbs import DBS

def db_connect(script, local = False):
    if local:
        dbs = DBS.localRegElmViz()
    else:
        dbs = DBS.pgdsn("RegElmViz")
    dbs["application_name"] = script
    return psycopg2.pool.ThreadedConnectionPool(1, 32, **dbs)

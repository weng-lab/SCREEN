#!/usr/bin/env python3

import sys
import os
import gzip
import json
from contextlib import contextmanager
import psycopg2


@contextmanager
def Cursor(DBCONN, query_name, *args, **kwargs):
    """ !@brief obtain a cursor from a DB connection pool.

    Preserves autocommit semantics for a cursor obtained from a pool;
    i.e., rolls back a transaction if an exception is thrown.
    args and kwargs are passed to psycopg2 cursor creator;
    see http://initd.org/psycopg/docs/usage.html#with-statement.
    
    from https://github.com/loadletter/mu-urlbox/blob/master/server.py

    @param DBCONN connection pool, as psycopg2.pool
    @param query_name friendly name for the calling script or method
    @return context manager-wrapped cursor
    
    """
    #print("getting conn...")
    con = DBCONN.getconn()
    try:
        # see http://stackoverflow.com/a/28139640 for use cases
        yield con.cursor(*args, **kwargs)
        con.commit()
    except psycopg2.ProgrammingError as e:
        print("ProgrammingError while running %s: %s" % (query_name, e.message))
        raise
    except:
        print("%s error while running %s" % (sys.exc_info()[0].__name__, query_name))
        raise
    finally:
        DBCONN.putconn(con, close=False)

class PostgresWrapper:
    def __init__(self, DBCONN):
        self.DBCONN = DBCONN

    def execute(self, name, q, qvars=None):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.execute(q, qvars)
        except:
            print("ERROR: execute: query was:", name, q, qvars)
            raise

    def fetchone(self, name, q, qvars=None):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.execute(q, qvars)
                return curs.fetchone()
        except:
            print("ERROR: query was:", name, q, qvars)
            raise

    def fetchoneAsNamedTuples(self, name, q, qvars=None):
        try:
            with Cursor(self.DBCONN, name,
                        cursor_factory=psycopg2.extras.NamedTupleCursor) as curs:
                curs.execute(q, qvars)
                return curs.fetchone()
        except:
            print("ERROR: query was:", name, q, qvars)
            raise

    def fetchall(self, name, q, qvars=None):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.execute(q, qvars)
                return curs.fetchall()
        except:
            print("ERROR: query was:", name, q, qvars)
            raise

    def rowcount(self, name, q, qvars=None):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.execute(q, qvars)
                return curs.rowcount
        except:
            print("ERROR: query was:", name, q, qvars)
            raise

    def fetchallAsNamedTuples(self, name, q, qvars=None):
        try:
            with Cursor(self.DBCONN, name,
                        cursor_factory=psycopg2.extras.NamedTupleCursor) as curs:
                curs.execute(q, qvars)
                return curs.fetchall()
        except:
            print("ERROR: query was:", name, q, qvars)
            raise

    def fetchallAsDict(self, name, q, qvars=None):
        try:
            with Cursor(self.DBCONN, name,
                        cursor_factory=psycopg2.extras.RealDictCursor) as curs:
                curs.execute(q, qvars)
                return curs.fetchall()
        except:
            print("ERROR: query was:", name, q, qvars)
            raise

    def update(self, name, q, qvars):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.execute(q, qvars)
        except:
            print("ERROR: update query was:", name, q, qvars)
            raise

    def updateReturning(self, name, q, qvars):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.execute(q, qvars)
                return curs.fetchone()
        except:
            print("ERROR: update query was:", name, q, qvars)
            raise

    def insert(self, name, q, qvars):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.execute(q, qvars)
        except:
            print("ERROR: insert query was:", name, q, qvars)
            raise

    def insertReturning(self, name, q, qvars):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.execute(q, qvars)
                return curs.fetchone()
        except:
            print("ERROR: insert query was:", name, q, qvars)
            raise

    def exists(self, name, q, qvars):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.execute(q, qvars)
                return curs.fetchone()[0]
        except:
            print("ERROR: exists query was:", name, q, qvars)
            raise

    def description(self, name, q, qvars):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.execute(q, qvars)
                return curs.description
        except:
            print("ERROR: description query was:", name, q, qvars)
            raise

    def mogrify(self, name, q, qvars):
        try:
            with Cursor(self.DBCONN, name) as curs:
                return curs.mogrify(q, qvars)
        except:
            print("ERROR: mogrify query was:", name, q, qvars)
            raise

    def copy_expert(self, name, q, fnp):
        try:
            with Cursor(self.DBCONN, name) as curs:
                with open(fnp, 'w') as f:
                    curs.copy_expert(q, f)
        except:
            print("ERROR: copy_expert query was:", name, q, fnp)
            raise

    def copy_expert_file_handle(self, name, q, fh):
        try:
            with Cursor(self.DBCONN, name) as curs:
                curs.copy_expert(q, fh)
        except:
            print("ERROR: copy_expert_file_handle query was:", name, q, fh)
            raise

from __future__ import print_function

import os
import sys

import psycopg2
from dbs import DBS
from utils import printt, eprint

from timeit import default_timer as timer


def vacumnAnalyze(conn, tableName):
    # http://stackoverflow.com/a/1017655
    print("about to vacuum analyze", tableName)
    old_isolation_level = conn.isolation_level
    conn.set_isolation_level(psycopg2.extensions.ISOLATION_LEVEL_AUTOCOMMIT)
    curs = conn.cursor()
    curs.execute("vacuum analyze " + tableName)
    conn.set_isolation_level(old_isolation_level)
    print("done")


def _idx(tn, col, suf=""):
    if suf:
        return tn + '_' + col + '_' + suf + "_idx"
    return tn + '_' + col + "_idx"


def makeIndex(curs, tableName, cols):
    for col in cols:
        idx = _idx(tableName, col)
        printt("indexing", idx)
        curs.execute("""
DROP INDEX IF EXISTS {idx};
CREATE INDEX {idx} on {tableName} ({col});
""".format(idx=idx, tableName=tableName, col=col))


def makeIndexTextPatternOps(curs, tableName, cols):
    for col in cols:
        idx = _idx(tableName, col, "text_pattern_ops")
        printt("indexing", idx)
        curs.execute("""
DROP INDEX IF EXISTS {idx};
CREATE INDEX {idx} on {tableName} 
USING btree ({col} text_pattern_ops);
""".format(idx=idx, tableName=tableName, col=col))


def makeIndexGinTrgmOps(curs, tableName, cols):
    # will need to run as psql postgres user:
    # \c regElmViz; CREATE EXTENSION pg_trgm;
    for col in cols:
        idx = _idx(tableName, col, "gin_trgm_ops")
        printt("indexing", idx)
        curs.execute("""
DROP INDEX IF EXISTS {idx};
CREATE INDEX {idx} on {tableName} 
USING gin ({col} gin_trgm_ops);
""".format(idx=idx, tableName=tableName, col=col))


def makeIndexMultiCol(curs, tableName, cols):
    name = '_'.join(cols)
    idx = _idx(tableName, name)
    printt("indexing", idx)
    curs.execute("""
DROP INDEX IF EXISTS {idx};
CREATE INDEX {idx} on {tableName} ({col});
""".format(idx=idx, tableName=tableName, col=','.join(cols)))


def makeIndexArr(curs, tableName, col, conn):
    num = arrayLength(curs, tableName, col)
    printt("indexing", tableName, col, '--', num, "elements per array")
    for i in xrange(num):
        sys.stdout.write('.')
        sys.stdout.flush()
        colByIdx = col + '[' + str(i + 1) + ']'
        idx = _idx(tableName, colByIdx)
        idx = idx.replace('[', '').replace(']', '')
        q = """
DROP INDEX IF EXISTS {idx};
CREATE INDEX {idx} on {tableName} (({col}));
""".format(idx=idx, tableName=tableName, col=colByIdx)
        # print(q)
        curs.execute(q)
        conn.commit()
    printt("\tdone; last", idx)


def makeIndexArr164startStop(curs, tableName, col):
    num = arrayLength(curs, tableName, col)
    printt("indexing", tableName, col, '--', num, "elements per array")
    for i in xrange(num):
        sys.stdout.write('.')
        sys.stdout.flush()
        colByIdx = col + '[' + str(i + 1) + ']'
        idx = _idx(tableName, colByIdx)
        idx = idx.replace('[', '').replace(']', '')
        q = """
        DROP INDEX IF EXISTS {idx};
        CREATE INDEX {idx} on {tableName} ({col});
        """.format(idx=idx, tableName=tableName,
                   col="(%s >= 1.64), start, stop DESC" % colByIdx)
        # print(q)
        curs.execute(q)
    print('')
    printt("\tdone; last", idx)


def makeIndexArr164(curs, tableName, col):
    """ !@brief SCREEN-specific indexing of float arrays, intended for use on Z-scores.
    @param curs database cursor, from getcursor below
    @param tableName name of the table to index
    @param col name of the column to index
    """
    num = arrayLength(curs, tableName, col)
    printt("indexing", tableName, col, '--', num, "elements per array")
    for i in xrange(num):
        sys.stdout.write('.')
        sys.stdout.flush()
        colByIdx = col + '[' + str(i + 1) + ']'
        idx = _idx(tableName, colByIdx)
        idx = idx.replace('[', '').replace(']', '')
        q = """
        DROP INDEX IF EXISTS {idx};
        CREATE INDEX {idx} on {tableName} ({col});
        """.format(idx=idx, tableName=tableName,
                   col="(%s >= 1.64)" % colByIdx)
        # print(q)
        curs.execute(q)
    print('')
    printt("\tdone; last", idx)


def makeIndexRev(curs, tableName, cols):
    for col in cols:
        idx = _idx(tableName, col)
        printt("indexing", idx, "DESC")
        curs.execute("""
DROP INDEX IF EXISTS {idx};
CREATE INDEX {idx} on {tableName} ({col} DESC);
""".format(idx=idx, tableName=tableName, col=col))


def makeIndexRange(curs, tableName, cols):
    for col in cols:
        idx = _idx(tableName, col)
        printt("indexing int range", idx)
        curs.execute("""
DROP INDEX IF EXISTS {idx};
create index {idx} on {tableName} using gist(intarray2int4range({col}));
""".format(idx=idx, tableName=tableName, col=col))


def makeIndexIntRange(curs, tableName, cols):
    # http://stackoverflow.com/a/14407839
    idx = _idx(tableName, "_".join(cols))
    printt("indexing int range", idx)
    curs.execute("""
DROP INDEX IF EXISTS {idx};
create index {idx} on {tableName} ({cols});
""".format(idx=idx, tableName=tableName,
           cols=",".join(cols) + " DESC"))


def makeIndexInt4Range(curs, tableName, cols):
    # http://stackoverflow.com/a/14407839
    idx = _idx(tableName, "_".join(cols))
    printt("indexing int4range", idx)
    curs.execute("""
DROP INDEX IF EXISTS {idx};
    create index {idx} on {tableName} (int4range({cols}));
""".format(idx=idx, tableName=tableName,
           cols=",".join(cols)))


def arrayLength(curs, tableName, col):
    curs.execute("""
select array_length({col}, 1) from {tn} limit 1
""".format(tn=tableName, col=col))
    return curs.fetchone()[0]

        
def timedQuery(curs, q, *args):
    start = timer()
    curs.execute(q, *args)
    end = timer()
    eprint("timed query", end - start, q)


def tableAndIndexSizes(curs):
    # from https://wiki.postgresql.org/wiki/Disk_Usage
    curs.execute("""
SELECT *, pg_size_pretty(total_bytes) AS total
    , pg_size_pretty(index_bytes) AS INDEX
    , pg_size_pretty(toast_bytes) AS toast
    , pg_size_pretty(table_bytes) AS TABLE
  FROM (
  SELECT *, total_bytes-index_bytes-COALESCE(toast_bytes,0) AS table_bytes FROM (
      SELECT c.oid,nspname AS table_schema, relname AS TABLE_NAME
              , c.reltuples AS row_estimate
              , pg_total_relation_size(c.oid) AS total_bytes
              , pg_indexes_size(c.oid) AS index_bytes
              , pg_total_relation_size(reltoastrelid) AS toast_bytes
          FROM pg_class c
          LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
          WHERE relkind = 'r'
  ) a
) a
order by index_bytes desc
""")

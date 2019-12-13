#!/usr/bin/env python3


import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip

from coord import Coord
from pg_common import PGcommon
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor


class PGautocomplete(object):
    def __init__(self, ps, assembly):
        self.ps = ps
        self.assembly = assembly

    def get_suggestions(self, q):
        # http://grokbase.com/t/postgresql/psycopg/125w8zab05/how-do-i-use-parameterized-queries-with-like
        with getcursor(self.ps.DBCONN, "Autocomplete::get_suggest") as curs:
            curs.execute("""
SELECT oname
FROM {tn}
WHERE name LIKE %s || '%%'
LIMIT 5
            """.format(tn=self.assembly + "_autocomplete"), (q,))
            r = curs.fetchall()
            if not r:
                print("no results for %s in %s" % (q, self.assembly))
                return []
            return [x[0] for x in r]

#!/usr/bin/env python

from __future__ import print_function
import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip

from coord import Coord
from pg_common import PGcommon
from config import Config
from get_set_mc import GetOrSetMemCache

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor


class PGautocomplete(GetOrSetMemCache):
    def __init__(self, pg, assembly):
        GetOrSetMemCache.__init__(self, assembly, "PGautocomplete")
        self.pg = pg
        self.assembly = assembly

    def get_suggestions(self, curs, q):
        # http://grokbase.com/t/postgresql/psycopg/125w8zab05/how-do-i-use-parameterized-queries-with-like
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

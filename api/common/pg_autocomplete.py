#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng



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


class PGautocomplete(object):
    def __init__(self, pw, assembly):
        self.pw = pw
        self.assembly = assembly

    def get_suggestions(self, q):
        # http://grokbase.com/t/postgresql/psycopg/125w8zab05/how-do-i-use-parameterized-queries-with-like
        rows = self.pw.fetchall("Autocomplete::get_suggest", """
        SELECT oname
        FROM {tn}
        WHERE name LIKE %s || '%%'
        LIMIT 5""".format(tn=self.assembly + "_autocomplete"),
                             (q,))
        if not rows:
            print("no results for %s in %s" % (q, self.assembly))
            return []
        return [x[0] for x in rows]

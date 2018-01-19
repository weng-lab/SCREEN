#!/usr/bin/env python2

from __future__ import print_function

import sys
import os
import psycopg2.extras

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from db_utils import getcursor


class InputData:
    def __init__(self, ps):
        self.ps = ps

    def main(self):
        def get(assembly):
            q = """
            select '{assembly}' as assembly, biosample_term_name, array_agg(fileid) AS fileIDs
            from {assembly}_peakintersectionsmetadata
            group by biosample_term_name
            order by biosample_term_name
            """.format(assembly = assembly)
            
            with getcursor(self.ps.DBCONN, "_gene",
                           cursor_factory=psycopg2.extras.NamedTupleCursor) as curs:
                curs.execute(q)
                return curs.fetchall()

        return get('mm10') + get('hg19')

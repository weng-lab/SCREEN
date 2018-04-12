#!/usr/bin/env python2

import sys
import os
import psycopg2.extras

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor


class PGge(object):
    def __init__(self, pg, assembly):
        self.pg = pg
        self.assembly = assembly

    def rnaseq_exps(self):
        q = """
SELECT biosample_term_name, expID, fileID, signal_files
FROM {tn}
""".format(
            tn=self.assembly + "_rnaseq_exps")
        
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q)
            rows = curs.fetchall()
            
        ret = {}
        for r in rows:
            biosample_term_name = r[0]
            if biosample_term_name not in ret:
                ret[biosample_term_name] = []
            ret[biosample_term_name].append({"expID": r[1],
                                             "fileID": r[2],
                                             "signal_files": r[3]})
        return ret
            


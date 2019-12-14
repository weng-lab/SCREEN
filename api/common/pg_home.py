#!/usr/bin/env python3

import sys
import os
import psycopg2.extras

from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../utils"))
from db_utils import getcursor


class PGHome:
    def __init__(self, pg):
        self.pg = pg

    def inputData(self):
        files = []

        with getcursor(self.pg.DBCONN, "intputData",
                       cursor_factory=psycopg2.extras.NamedTupleCursor) as curs:
            curs.execute("""
            SELECT runDate FROM {tableName}
            """.format(tableName = "hg19_peakintersectionsmetadata_runDate"))
            
            version = curs.fetchall()[0][0]
            
            for assembly in Config.assemblies:
                curs.execute("""
                SELECT %(assembly)s as assembly, biosample_term_name, array_agg(fileid) AS fileids
                FROM {tableName}
                GROUP BY biosample_term_name
                ORDER BY biosample_term_name
                """.format(tableName = assembly + "_peakintersectionsmetadata"),
                             {"assembly": assembly})
                files += [r._asdict() for r in curs.fetchall()]
            
        return {"files": files,
                "version": version}

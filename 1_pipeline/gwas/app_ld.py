#!/usr/bin/python

from __future__ import print_function

import cherrypy, jinja2, os, sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../../metadata/utils'))
from templates import Templates
from db_utils import getcursor

class SnpApp():
    def __init__(self, args, viewDir, staticDir, pg):
        self.templates = Templates(viewDir, staticDir)
        self.pg = pg

    @cherrypy.expose
    def snp_ld(self, *args, **kwargs):
        snps = args[0].split(',')
        q = """
SELECT snp, info
FROM ld_eur
WHERE snp IN %s
"""
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q, (tuple(snps),))
            rows = curs.fetchall()
        ret = []
        for r in rows:
            ret.append('\t'.join(r))
        return '\n'.join(ret)
        
    @cherrypy.expose
    def snp_coord(self, *args, **kwargs):
        assembly = args[0]
        snps = args[1].split(',')
        tableName = assembly + "_snps"
        q = """
SELECT chrom, start, stop, snp
FROM {tn}
WHERE snp IN %s
""".format(tn = tableName)
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q, (tuple(snps),))
            rows = curs.fetchall()
        ret = []
        for r in rows:
            ret.append('\t'.join([str(x) for x in r]))
        return '\n'.join(ret)

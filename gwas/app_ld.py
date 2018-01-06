#!/usr/bin/python

from __future__ import print_function

import cherrypy
import jinja2
import os
import sys

sys.path.append(os.path.join(os.path.dirname(__file__), '../../metadata/utils'))
from templates import Templates
from db_utils import getcursor


class SnpApp():
    def __init__(self, args, viewDir, staticDir, pg, allowedpops = ["EUR"]):
        self.templates = Templates(viewDir, staticDir)
        self.pg = pg
        self.allowedpops = allowedpops

    @cherrypy.expose
    def eur(self, *args, **kwargs):
        return self.pop_generic("eur", *args, **kwargs)

    @cherrypy.expose
    def amr(self, *args, **kwargs):
        return self.pop_generic("amr", *args, **kwargs)

    @cherrypy.expose
    def afr(self, *args, **kwargs):
        return self.pop_generic("afr", *args, **kwargs)

    @cherrypy.expose
    def asn(self, *args, **kwargs):
        return self.pop_generic("asn", *args, **kwargs)

    def pop_generic(self, pop, *args, **kwargs):
        if args[0] == "snp_ld":
            return self.snp_ld(pop, *args[1:], **kwargs)
        elif args[0] == "snp_maf":
            return self.snp_maf(pop, *args[1:], **kwargs)

    def snp_ld(self, pop, *args, **kwargs):
        snps = args[0].split(',')
        q = """
SELECT snp, info
FROM ld_{pop}
WHERE snp IN %s
""".format(pop = pop.lower())
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q, (tuple(snps),))
            rows = curs.fetchall()
        ret = []
        for r in rows:
            ret.append('\t'.join(r))
        return '\n'.join(ret)

    @cherrypy.expose
    def snp_maf(self, pop, *args, **kwargs):
        snps = args[0].split(",")
        q = """
SELECT snp, refallele, altallele, frequency
FROM {pop}_maf
WHERE snp IN %s
""".format(pop = pop.lower())
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
""".format(tn=tableName)
        with getcursor(self.pg.DBCONN, "pg") as curs:
            curs.execute(q, (tuple(snps),))
            rows = curs.fetchall()
        ret = []
        for r in rows:
            ret.append('\t'.join([str(x) for x in r]))
        return '\n'.join(ret)

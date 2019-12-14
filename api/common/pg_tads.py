#!/usr/bin/env python3



import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip

from coord import Coord
from pg_common import PGcommon
from pg_cre_table import PGcreTable
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom, checkAssembly

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor


class PGtadsWrapper:
    def __init__(self, pg):
        self.assemblies = ["hg19"]  # Config.assemblies
        self.pgs = {a: PGgwas(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]


class PGtads(object):
    def __init__(self, pg, assembly):
        self.pg = pg
        checkAssembly(assembly)
        self.assembly = assembly
        pg = PGcommon(self.pg, self.assembly)

    def get_biosamples(self):
        with getcursor(self.pg.DBCONN, "pg_tads$PGtads::__init__") as curs:
            curs.execute("SELECT acc, name FROM {assembly}_tad_biosamples".format(assembly=self.assembly))
            return [[name, None, acc] for acc, name in curs.fetchall()]

    def get_chrom_btn(self, name, chrom):
        with getcursor(self.pg.DBCONN, "pg_tads$PGtads::get_chrom") as curs:
            curs.execute("""SELECT start, stop FROM {assembly}_all_tads as tads, {assembly}_tad_biosamples as bs
                            WHERE bs.name = %s and tads.acc = bs.acc""".format(assembly=self.assembly), (name,))
            return [[start, stop] for start, stop in curs.fetchall()]

    def get_chrom_acc(self, acc, chrom):
        with getcursor(self.pg.DBCONN, "pg_tads$PGtads::get_chrom") as curs:
            curs.execute("""SELECT start, stop FROM {assembly}_all_tads as tads, {assembly}_tad_biosamples as bs
                            WHERE bs.acc = %s and tads.acc = bs.acc""".format(assembly=self.assembly), (acc,))
            return [[start, stop] for start, stop in curs.fetchall()]

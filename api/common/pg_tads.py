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
from pg_cre_table import PGcreTable
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom, checkAssembly


class PGtadsWrapper:
    def __init__(self, pw):
        self.assemblies = ["hg19"]  # Config.assemblies
        self.pgs = {a: PGgwas(pw, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]


class PGtads(object):
    def __init__(self, pw, assembly):
        self.pw = pw
        checkAssembly(assembly)
        self.assembly = assembly
        pg = PGcommon(self.pg, self.assembly)

    def get_biosamples(self):
        rows = self.pw.fetchall("pg_tads$PGtads::__get_biosamples__", """
        SELECT acc, name 
        FROM {assembly}_tad_biosamples
        """.format(assembly=self.assembly))
        return [[name, None, acc] for acc, name in rows]

    def get_chrom_btn(self, name, chrom):
        rows = self.pw.fetchall("pg_tads$PGtads::__get_chrom_btn__", """
        SELECT start, stop 
        FROM {assembly}_all_tads as tads, 
        {assembly}_tad_biosamples as bs
        WHERE bs.name = %s and tads.acc = bs.acc
        """.format(assembly=self.assembly), (name,))
        return [[start, stop] for start, stop in rows]

    def get_chrom_acc(self, acc, chrom):
        rows = self.pw.fetchall("pg_tads$PGtads::__get_chrom_acc__", """
        SELECT start, stop 
        FROM {assembly}_all_tads as tads, {assembly}_tad_biosamples as bs
        WHERE bs.acc = %s and tads.acc = bs.acc
        """.format(assembly=self.assembly), (acc,))
        return [[start, stop] for start, stop in rows]

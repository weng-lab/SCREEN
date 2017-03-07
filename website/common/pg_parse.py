#!/usr/bin/env python

from __future__ import print_function
import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip

from coord import Coord
from pg_common import PGcommon
from gene_parse import GeneParse
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor

class PGparseWrapper:
    def __init__(self, pg):
        self.assemblies = Config.assemblies
        self.pgs = {a : PGparse(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

class PGparse:
    def __init__(self, pg, assembly):
        self.pg = pg
        self.assembly = assembly

    def _get_snpcoord(self, s):
        with getcursor(self.pg.DBCONN, "parse_search$_get_snpcoord") as curs:
            curs.execute("""
SELECT chrom, start, stop
FROM {tn}
WHERE snp = %s
""".format(tn = self.assembly + "_snps"), (s, ))
            r = curs.fetchone()
            if r:
                return Coord(r[0], r[1], r[2])
        return None

    def _gene_id_to_symbol(self, _id):
        with getcursor(self.pg.DBCONN, "parse_search$gene_id_to_symbol") as curs:
            curs.execute("""
SELECT gi.approved_symbol
FROM {assembly}_gene_info gi
WHERE gi.id = %s
            """.format(assembly = self.assembly), (_id,))
            rows = curs.fetchall()
        if not rows:
            return None
        return rows[0]

    def _exactGeneMatch(self, s, usetss, tssdist):
        with getcursor(self.pg.DBCONN, "parse_search$parse") as curs:
            slo = s.lower().strip()
            curs.execute("""
SELECT ac.oname,
ac.chrom, ac.start, ac.stop,
ac.altchrom, ac.altstart, ac.altstop,
similarity(ac.name, %s) AS sm, ac.pointer,
gi.approved_symbol
FROM {assembly}_gene_search ac
INNER JOIN {assembly}_gene_info gi
ON gi.id = ac.pointer
WHERE gi.approved_symbol = %s
ORDER BY sm DESC
LIMIT 50
                """.format(assembly = self.assembly), (slo, s))
            rows = curs.fetchall()
        if rows:
            r = rows[0]
            if isclose(1, r[7]): # similarity
                return [GeneParse(self.assembly, r, s, usetss, tssdist)]
        return [GeneParse(self.assembly, r, s, usetss, tssdist) for r in rows]

    def _fuzzyGeneMatch(self, s, usetss, tssdist):
        with getcursor(self.pg.DBCONN, "parse_search$parse") as curs:
            slo = s.lower()
            curs.execute("""
SELECT ac.oname,
ac.chrom, ac.start, ac.stop,
ac.altchrom, ac.altstart, ac.altstop,
similarity(ac.name, %s) AS sm, ac.pointer,
gi.approved_symbol
FROM {assembly}_gene_search ac
INNER JOIN {assembly}_gene_info gi
ON gi.id = ac.pointer
WHERE ac.name %% %s
ORDER BY sm DESC
LIMIT 50
                """.format(assembly = self.assembly),
                         (slo, slo))
            rows = curs.fetchall()
        return [GeneParse(self.assembly, r, s, usetss, tssdist) for r in rows]
    
    def try_find_gene(self, s, usetss, tssdist):
        if type(tssdist) is not int:
            tssdist = int(tssdist.replace("kb", "")) * 1000

        genes = self._exactGeneMatch(s, usetss, tssdist)
        if not genes:
            genes = self._fuzzyGeneMatch(s, usetss, tssdist)
        return genes
    
    def has_overlap(self, coord):
        if not coord:
            return False
        with getcursor(self.pg.DBCONN, "parse_search$ParseSearch::parse") as curs:
            curs.execute("""
SELECT accession
FROM {tn}
WHERE maxZ >= 1.64
AND chrom = %s
AND int4range(start, stop) && int4range(%s, %s)
""".format(tn = self.assembly + "_cre_all"),
                         (coord.chrom, coord.start, coord.end))
            if curs.fetchone():
                return True
        return False

    def _find_celltype(self, q, rev = False):
        p = q.split()
        interpretation = None

        for i in xrange(len(p)):
            s = " ".join(p[:len(p) - i]) if not rev else " ".join(p[i:])
            with getcursor(self.pg.DBCONN, "pg_parse::_find_celltype") as curs:
                curs.execute("""
SELECT cellType, similarity(LOWER(cellType), '{q}') AS sm
FROM {assembly}_rankCellTypeIndexex
WHERE LOWER(cellType) % '{q}'
ORDER BY sm DESC
LIMIT 1
""".format(assembly=self.assembly, q=s))
                r = curs.fetchall()
                if not r:
                    curs.execute("""
SELECT cellType
FROM {assembly}_rankCellTypeIndexex
WHERE LOWER(cellType) LIKE '{q}%'
LIMIT 1
""".format(assembly=self.assembly, q=s))
                    r = curs.fetchall()
            if r:
                if r[0][0].lower().strip() not in s.lower().strip() or s.lower().strip() not in r[0][0].lower().strip():
                    k = r[0][0].replace("_", " ")
                    interpretation = "Showing results for \"%s\"" % (k if not interpretation else interpretation + " " + k)
                return (" ".join(p[len(p) - i:]) if not rev else " ".join(p[i:]), r[0][0], interpretation)
        return (q, None, None)

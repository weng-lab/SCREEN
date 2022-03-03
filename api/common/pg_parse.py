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
from gene_parse import GeneParse
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom, checkAssembly


class PGparseWrapper:
    def __init__(self, pw):
        self.assemblies = Config.assemblies
        self.pgs = {a: PGparse(pg, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

    
class PGparse(object):
    def __init__(self, pw, assembly):
        self.pw = pw
        checkAssembly(assembly)
        self.assembly = assembly

    def _get_snpcoord(self, s):
        r = self.pw.fetchone("PGparse$_get_snpcoord", """
        SELECT chrom, start, stop
        FROM {tn}
        WHERE snp = %s
        """.format(tn=self.assembly + "_snps"),
                             (s, ))
        
        if r:
            return Coord(r[0], r[1], r[2])
        return None
    
    def _gene_id_to_symbol(self, _id):
        rows = self.pw.fetchall("PGparse$gene_id_to_symbol", """
        SELECT gi.approved_symbol
        FROM {assembly}_gene_info gi
        WHERE gi.id = %s
        """.format(assembly=self.assembly),
                             (_id,))
        if not rows:
            return None
        return rows[0]

    def _exactGeneMatch(self, s, usetss, tssDist):
        slo = s.lower().strip()
        rows = self.pw.fetchall("PGparse$parse", """
SELECT ac.oname,
ac.chrom, ac.start, ac.stop,
ac.altchrom, ac.altstart, ac.altstop,
similarity(ac.name, %s) AS sm, ac.pointer,
gi.info->'symbol' AS approved_symbol, gi.strand
FROM {assembly}_gene_search ac
INNER JOIN {assembly}_gene_info gi
ON gi.id = ac.pointer
WHERE gi.approved_symbol = %s
ORDER BY sm DESC
LIMIT 50
                """.format(assembly=self.assembly),
                                (slo, s))
        r = None
        if rows:
            r = rows[0]
        if r:
            if r[9] is None: r = tuple([ x if i != 9 else r[0] for i, x in enumerate(r) ])
            if isclose(1, r[7]):  # similarity
                return [GeneParse(self.assembly, r, s, usetss, tssDist)]
        return [] # [GeneParse(self.assembly, r, s, usetss, tssDist) for r in rows]

    def _fuzzyGeneMatch(self, s, usetss, tssDist):
        slo = s.lower()
        rows = self.pw.fetchall("PGparse$_fuzzyGeneMatch", """
        SELECT ac.oname,
        ac.chrom, ac.start, ac.stop,
        ac.altchrom, ac.altstart, ac.altstop,
        similarity(ac.name, %s) AS sm, ac.pointer,
        gi.approved_symbol, gi.strand
        FROM {assembly}_gene_search ac
        INNER JOIN {assembly}_gene_info gi
        ON gi.id = ac.pointer
        WHERE ac.name %% %s
        ORDER BY sm DESC
        LIMIT 50
        """.format(assembly=self.assembly),
                                (slo, slo))
        return [GeneParse(self.assembly, r, s, usetss, tssDist) for r in rows]

    def try_find_gene(self, s, usetss, tssDist):
        genes = self._exactGeneMatch(s, usetss, tssDist)
        if not genes:
            return self._fuzzyGeneMatch(s, usetss, tssDist)
        return genes

    def has_overlap(self, coord):
        if not coord:
            return False
        row = self.pw.fetchone("pg_parse$has_overlap", """
        SELECT accession
        FROM {tn}
        WHERE maxZ >= 1.64
        AND chrom = %s
        AND int4range(start, stop) && int4range(%s, %s)
        """.format(tn=self.assembly + "_cre_all"),
                                (coord.chrom, coord.start, coord.end))
        if row:
            return True
        return False

    def _find_celltype(self, q, rev=False):
        p = q.split()
        interpretation = None

        for i in range(len(p)):
            s = " ".join(p[:len(p) - i]) if not rev else " ".join(p[i:])

            rows = self.pw.fetchall("pg_parse::_find_celltype", """
            SELECT cellType, similarity(LOWER(cellType), '{q}') AS sm
            FROM {assembly}_rankCellTypeIndexex
            WHERE LOWER(cellType) % '{q}'
            ORDER BY sm DESC
            LIMIT 1
            """.format(assembly=self.assembly, q=s))

            if not rows:
                rows = self.pw.fetchall("pg_parse::_find_celltype", """
                SELECT cellType
                FROM {assembly}_rankCellTypeIndexex
                WHERE LOWER(cellType) LIKE '{q}%'
                LIMIT 1
                """.format(assembly=self.assembly, q=s))
                
            if rows:
                r = rows[0]
                ct = r[0]
                if ct.lower().strip() not in s.lower().strip() or s.lower().strip() not in ct.lower().strip():
                    k = ct.replace("_", " ")
                    interpretation = "Showing results for \"%s\"" % (k if not interpretation else interpretation + " " + k)
                return (" ".join(p[len(p) - i:]) if not rev else " ".join(p[i:]), ct, interpretation)
        return (q, None, None)

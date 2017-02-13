#!/usr/bin/env python

from __future__ import print_function

import math

from cre import CRE
from common.pg_gwas import PGgwas

class Gwas:
    def __init__(self, assembly, ps, cache):
        self.assembly = assembly
        self.cache = cache
        self.pgGwas = PGgwas(ps, assembly)

        self.studies = self.pgGwas.gwasStudies()
        self.byStudy = {r["value"] : r for r in self.studies}

    def checkStudy(self, gwas_study):
        return gwas_study in self.byStudy

    def totalLDblocks(self, gwas_study):
        return self.byStudy[gwas_study]["total_ldblocks"]

    def numLdBlocksOverlap(self, gwas_study):
        return self.pgGwas.numLdBlocksOverlap(gwas_study)

    def percCresEnhancer(self, gwas_study):
        return 0

    def percCresPromoter(self, gwas_study):
        return 0

    def gwasEnrichment(self, gwas_study):
         rows = self.pgGwas.gwasEnrichment(gwas_study)
         rows = [[r.biosample_term_name,
                  round(-1.0 * math.log10(r.fdr), 2),
                  r.cellTypeName]
                 for r in rows]
         rows.sort(key = lambda x: x[1], reverse=True)

         accs = {}
         for r in rows:
             ct = r[2]
             accs[ct] = self.pgSearch.gwasPercentActive(gwas_study,
                                                        ct)
         return rows, accs


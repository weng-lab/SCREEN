#!/usr/bin/env python

from __future__ import print_function

import math
from cre import CRE

class Gwas:
    def __init__(self, assembly, cache, pgSearch):
        self.assembly = assembly
        self.cache = cache
        self.pgSearch = pgSearch
        self.gwas = None
        self.studies = None
        self.load()

    def load(self):
        if not self.gwas:
            self.gwas = self.pgSearch.gwas()
        if not self.studies:
            studies = list(set([e.authorPubmedTrait for e in self.gwas]))
            self.studies = [{"value" : e} for e in studies]

    def overlapWithCresPerc(self, gwas_study):
         return self.pgSearch.gwasOverlapWithCresPerc(gwas_study)

    def gwasEnrichment(self, gwas_study):
         rows = self.pgSearch.gwasEnrichment(gwas_study)
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


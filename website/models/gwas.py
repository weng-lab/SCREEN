#!/usr/bin/env python

from __future__ import print_function

from cre import CRE

class Gwas:
    def __init__(self, cache, pgSearch):
        self.cache = cache
        self.pgSearch = pgSearch
        self.enrichment = None
        self.gwas = None
        self.studies = None
        self.load()

    def load(self):
        if not self.enrichment:
            self.enrichment = self.pgSearch.gwasEnrichment()
        if not self.gwas:
            self.gwas = self.pgSearch.gwas()
        if not self.studies:
            studies = list(set([e.authorPubmedTrait for e in self.gwas]))
            self.studies = [{"value" : e} for e in studies]

    def overlapWithCres(self, gwas_study):
         return self.pgSearch.gwasOverlapWithCres(gwas_study)

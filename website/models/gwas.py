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

    def topCellTypes(self, gwas_study):
         rows = []
         for r in self.pgGwas.gwasEnrichment(gwas_study):
             r["neglogfdr"] = round(-1.0 * math.log10(r["fdr"]), 2)
             rows.append(r)
         rows.sort(key = lambda x: x["neglogfdr"], reverse=True)
         return rows

    def cres(self, gwas_study, ct):
        accs, fieldsOut = self.pgGwas.gwasPercentActive(gwas_study, ct)

        # accession, snp, geneid, zscores
        totalActive = 0
        total = len(accs)
        activeAccs = []

        def any_lambda(function, iterable):
            # http://stackoverflow.com/a/19868175
            return any(function(i) for i in iterable)

        for a in accs:
            if any_lambda(lambda x: x > 1.64, a[3:]):
                totalActive += 1
                a = list(a)
                a[1] = ", ".join(sorted(a[1])) # snps
                activeAccs.append(a)

        percActive = 0
        if total > 0:
            percActive = round(float(totalActive) / total * 100, 2)

        def form(v):
            return [["%s%% CREs active" % v, v, 0],
                    ["", 100 - v, v]]

        keys = ["accession", "snp", "geneid"] + fieldsOut
        ret = [dict(zip(keys, r)) for r in accs]

        hiddenFields = set(["promoter zscore", "enhancer zscore",
                            "dnase zscore"]) - set(fieldsOut)
        if hiddenFields:
            for r in ret:
                for f in hiddenFields:
                    r[f] = ''
        vcols = {}
        for f in ["promoter zscore", "enhancer zscore", "dnase zscore"]:
            vcols[f] = f not in hiddenFields
        return {"accessions" : ret,
                "vcols" : vcols,
                "percActive" : percActive}



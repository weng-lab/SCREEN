#!/usr/bin/env python3

# SPDX-License-Identifier: MIT
# Copyright (c) 2016-2020 Michael Purcaro, Henry Pratt, Jill Moore, Zhiping Weng




from .cre import CRE
from common.pg_gwas import PGgwas


class Gwas:
    def __init__(self, assembly, ps, cache):
        self.assembly = assembly
        self.cache = cache
        self.pgGwas = PGgwas(ps, assembly)

        self.studies = self.pgGwas.gwasStudies()
        self.byStudy = {r["value"]: r for r in self.studies}

    def checkStudy(self, gwas_study):
        return gwas_study in self.byStudy

    def numCresOverlap(self, gwas_study):
        return self.pgGwas.numCresOverlap(gwas_study)

    def totalLDblocks(self, gwas_study):
        return self.byStudy[gwas_study]["total_ldblocks"]

    def numLdBlocksOverlap(self, gwas_study):
        return self.pgGwas.numLdBlocksOverlap(gwas_study)

    def percCresEnhancer(self, gwas_study):
        return 0

    def percCresPromoter(self, gwas_study):
        return 0

    def allCellTypes(self, gwas_study):
        return self.pgGwas.gwasEnrichment(gwas_study)

    def cres(self, gwas_study, ct):
        cres, fieldsOut = self.pgGwas.gwasPercentActive(gwas_study, ct)

        # accession, snp, geneid, zscores
        totalActive = 0
        total = len(cres)
        activeCres = []

        def any_lambda(function, iterable):
            # http://stackoverflow.com/a/19868175
            return any(function(i) for i in iterable)

        for a in cres:
            if ct is None or (a.get("promoter zscore", 0) > 1.64 or a.get("enhancer zscore", 0) > 1.64 or a.get("dnase zscore", 0) > 1.64):
                totalActive += 1
                activeCres.append(a)

        hiddenFields = set(["promoter zscore", "enhancer zscore",
                            "dnase zscore"]) - set(fieldsOut)
        if hiddenFields:
            for r in cres:
                for f in hiddenFields:
                    r[f] = ''
        lookup = self.cache.geneIDsToApprovedSymbol
        for r in activeCres:
            r["genesallpc"] = {"all": [lookup[gid] for gid in r["gene_all_id"][:3]],
                               "pc": [lookup[gid] for gid in r["gene_pc_id"][:3]],
                               "accession": r["info"]["accession"]}
        vcols = {}
        for f in ["promoter zscore", "enhancer zscore", "dnase zscore"]:
            vcols[f] = f not in hiddenFields
        if ct is None: ct = "_all"
        return {ct: {"accessions": activeCres,
                     "vcols": vcols}}

    def mainTable(self, gwas_study):
        ret = {gwas_study: {"gwas_study": self.byStudy[gwas_study],
                            "mainTable": self._mainTableInfo(gwas_study),
                            "topCellTypes": self.allCellTypes(gwas_study)}}
        if len(ret[gwas_study]["topCellTypes"]) == 0:
            ret[gwas_study]["cres"] = self.cres(gwas_study, None)
        return ret

    def _mainTableInfo(self, gwas_study):
        total = self.totalLDblocks(gwas_study)
        overlap = self.numLdBlocksOverlap(gwas_study)
        overlapStr = "%d (%d%%)" % (overlap, int(float(overlap) / float(total) * 100.0))
        return [{"totalLDblocks": total,
                 "numLdBlocksOverlap": overlap,
                 "numLdBlocksOverlapFormat": overlapStr,
                 "numCresOverlap": self.numCresOverlap(gwas_study)}]

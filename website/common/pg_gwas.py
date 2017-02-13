#!/usr/bin/env python

import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip

from coord import Coord
from pg_common import PGcommon

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom

sys.path.append(os.path.join(os.path.dirname(__file__),
                             '../../../metadata/utils/'))
from db_utils import getcursor

class PGgwasWrapper:
    def __init__(self, pg):
        self.pgs = {
            "hg19" : PGgwas(pg, "hg19"),
            "mm10" : PGgwas(pg, "mm10")}

    def __getitem__(self, assembly):
        return self.pgs[assembly]

class PGgwas:
    def __init__(self, pg, assembly):
        self.pg = pg
        self.assembly = assembly

        pg = PGcommon(self.pg, self.assembly)
        self.ctmap = pg.makeCtMap()

    def gwasEnrichment(self, gwas_study):
        with getcursor(self.pg.DBCONN, "gwasEnrichment") as curs:
            q = """
SELECT biosample_term_name, fdr, cellTypeName
FROM {tn}
WHERE authorPubmedTrait = %s
""".format(tn = self.assembly + "_gwas_enrichment")
            curs.execute(q, (gwas_study, ))
            rows = curs.fetchall()
        keys = ["biosample_term_name", "fdr", "cellTypeName"]
        return [dict(zip(keys, r)) for r in rows]

    def gwasStudies(self):
        with getcursor(self.pg.DBCONN, "gwasStudies") as curs:
            q = """
SELECT DISTINCT(authorpubmedtrait), author, pubmed, trait, COUNT(DISTINCT(ldblock))
FROM {tn}
GROUP BY authorpubmedtrait, author, pubmed, trait
ORDER BY trait
""".format(tn = self.assembly + "_gwas")
            curs.execute(q)
            rows = curs.fetchall()
        keys = ["value", "author", "pubmed", "trait", "total_ldblocks"]
        return [dict(zip(keys, r)) for r in rows]

    def numLdBlocksOverlap(self, gwas_study):
        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
SELECT COUNT(DISTINCT(ldblock))
FROM {assembly}_gwas as gwas,
{assembly}_cre as cre,
{assembly}_gwas_overlap as over
WHERE gwas.authorPubmedTrait = over.authorPubmedTrait
AND cre.accession = over.accession
AND int4range(gwas.start, gwas.stop) && int4range(cre.start, cre.stop)
AND gwas.authorPubmedTrait = %s
""".format(assembly = self.assembly)
            curs.execute(q, (gwas_study, ))
            return curs.fetchone()[0]

    def gwasOverlapWithCres(self, gwas_study):
        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
SELECT cre.accession
FROM {assembly}_gwas as gwas, {assembly}_cre as cre
WHERE gwas.chrom = cre.chrom
AND int4range(gwas.start, gwas.stop) && int4range(cre.start, cre.stop)
AND gwas.authorPubmedTrait = %s
""".format(assembly = self.assembly)
            curs.execute(q, (gwas_study, ))
            return [r[0] for r in curs.fetchall()]

    def gwasAccessions(self, gwas_study):
        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
SELECT accession
FROM {tn}
where authorPubmedTrait = %s
""".format(tn = self.assembly + "_gwas_overlap")
            curs.execute(q, (gwas_study, ))
            return [r[0] for r in curs.fetchall()]

    def gwasPercentActive(self, gwas_study, ct):
        fields = ["cre.accession", "array_agg(snp)",
                  "infoAll.approved_symbol AS geneid"]
        groupBy = ["cre.accession",
                  "infoAll.approved_symbol"]

        fieldsOut = []
        for assay in [("dnase", "dnase"),
                      ("promoter", "h3k4me3_only"),
                      ("enhancer", "h3k27ac_only")]:
            if ct not in self.ctmap[assay[0]]:
                continue
            cti = self.ctmap[assay[0]][ct]
            fieldsOut.append(assay[0] + " zscore")
            fields.append("cre.%s_zscore[%d] AS %s_zscore" %
                          (assay[1], cti, assay[0]))
            groupBy.append("cre.%s_zscore[%d]" %
                          (assay[1], cti))

        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
SELECT {fields}
FROM {assembly}_cre as cre,
{assembly}_gwas_overlap as over,
{assembly}_gene_info as infoAll
WHERE cre.gene_all_id[1] = infoAll.geneid
AND cre.accession = over.accession
AND over.authorPubmedTrait = %s
GROUP BY {groupBy}
""".format(assembly = self.assembly,
           fields = ', '.join(fields),
           groupBy = ', '.join(groupBy))
            curs.execute(q, (gwas_study, ))
            accs = curs.fetchall()

        # accession, snp, geneid, zscores
        totalActive = 0
        total = len(accs)
        activeAccs = []

        def any_lambda(function, iterable):
            # http://stackoverflow.com/a/19868175
            return any(function(i) for i in iterable)

        for a in accs:
            if any_lambda(lambda x: x >= 1.64, a[3:]):
                totalActive += 1
                a = list(a)
                a[1] = ", ".join(sorted(a[1]))
                activeAccs.append(a)

        percActive = 0
        if total > 0:
            percActive = round(float(totalActive) / total * 100, 2)

        def form(v):
            return [["%s%% CREs active" % v, v, 0],
                    ["", 100 - v, v]]

        return {"accessions" : activeAccs,
                "percActive" : percActive,
                "bar" : form(percActive),
                "header" : ["accession", "snp", "geneid"] + fieldsOut}

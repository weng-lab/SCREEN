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

    def gwasStudies(self):
        with getcursor(self.pg.DBCONN, "gwasStudies") as curs:
            q = """
SELECT authorpubmedtrait, author, pubmed, trait, numLDblocks
FROM {tn}
ORDER BY trait
""".format(tn = self.assembly + "_gwas_studies")
            curs.execute(q)
            rows = curs.fetchall()
        keys = ["value", "author", "pubmed", "trait", "total_ldblocks"]
        return [dict(zip(keys, r)) for r in rows]

    def gwasEnrichment(self, gwas_study):
        with getcursor(self.pg.DBCONN, "gwasEnrichment") as curs:
            q = """
SELECT expID, cellTypeName, biosample_term_name, {col}
FROM {tn}
""".format(tn = self.assembly + "_gwas_enrichment", col = gwas_study)
            curs.execute(q)
            rows = curs.fetchall()
        cols = ["expID", "cellTypeName", "biosample_term_name", "fdr"]
        return [dict(zip(cols, r)) for r in rows]

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

    def gwasAccessions(self, gwas_study):
        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
SELECT accession
FROM {tn}
where authorPubmedTrait = %s
""".format(tn = self.assembly + "_gwas_overlap")
            curs.execute(q, (gwas_study, ))
            return [r[0] for r in curs.fetchall()]

    def numCresOverlap(self, gwas_study):
        with getcursor(self.pg.DBCONN, "gwas") as curs:
            q = """
SELECT count(0)
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

        fieldsOut = ["accession", "snps", "geneid"]
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
            rows = curs.fetchall()
        ret = [dict(zip(fieldsOut, r)) for r in rows]
        return ret, fieldsOut


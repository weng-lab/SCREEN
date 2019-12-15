#!/usr/bin/env python3



import sys
import os
from natsort import natsorted
from collections import namedtuple
import gzip
import io

from coord import Coord
from pg_common import PGcommon
from pg_cre_table import PGcreTable
from config import Config

sys.path.append(os.path.join(os.path.dirname(__file__), "../../common"))
from cre_utils import isaccession, isclose, checkChrom, checkAssembly


class PGgwasWrapper:
    def __init__(self, pw):
        self.assemblies = ["hg19"]  # Config.assemblies
        self.pws = {a: PGgwas(pw, a) for a in self.assemblies}

    def __getitem__(self, assembly):
        return self.pgs[assembly]


class PGgwas(object):
    def __init__(self, pw, assembly):
        self.pw = pw
        checkAssembly(assembly)
        self.assembly = assembly

        pg = PGcommon(self.pw, self.assembly)
        self.ctmap = pg.makeCtMap()
        self.ctsTable = pg.makeCTStable()

        # does does gwas_enrichment_fdr table exist for this assembly?
        self.wenrichment = {}

        tn = assembly + "_gwas_enrichment_fdr"
        hasTable = self.pw.exists("PGgwas", """
        SELECT EXISTS(
        SELECT * FROM information_schema.tables 
        WHERE table_name=%s)""", (tn,))

        if hasTable:
            cols = self.pw.description("PGgwas", """
            SELECT * FROM {tn} LIMIT 0""".format(tn=tn))
            self.wenrichment = { x[0]: True for x in cols }

    def gwasStudies(self):
        rows = self.pw.fetchall("gwasStudies", """
        SELECT authorpubmedtrait, author, pubmed, trait, numLDblocks
        FROM {tn}
        ORDER BY trait
        """.format(tn=self.assembly + "_gwas_studies"))

        keys = ["value", "author", "pubmed", "trait", "total_ldblocks", "hasenrichment"]
        rows = [ tuple(list(x) + [x[0].lower() in self.wenrichment]) for x in rows ]
        return [dict(list(zip(keys, r))) for r in rows]

    def gwasEnrichment(self, gwas_study):
        try:
            rows = self.pw.fetchall("gwasEnrichment", """
            SELECT 
            fdr.expID, 
            fdr.cellTypeName, 
            fdr.biosample_summary,
            fdr.{col} as fdr,
            pval.{col} as pval,
            fe.{col} as foldenrichment
            FROM {tnfdr} fdr
            INNER JOIN {tnpval} pval
            ON fdr.expid = pval.expid
            INNER JOIN {tnfe} fe
            ON fe.expid = fdr.expid
            ORDER BY fdr DESC, pval
            """.format(tnfdr=self.assembly + "_gwas_enrichment_fdr",
                       tnpval=self.assembly + "_gwas_enrichment_pval",
                       tnfe = self.assembly + "_gwas_fold_enrichment",
                       col=gwas_study))
        except:
            return []

        cols = ["expID", "cellTypeName", "biosample_summary",
                "fdr", "pval", "foldenrichment"]
        print("!", file = sys.stderr)
        return [dict(list(zip(cols, r))) for r in rows]

    def numLdBlocksOverlap(self, gwas_study):
        row = self.pw.fetchone("numLdBlocksOverlap", """
        SELECT COUNT(DISTINCT(ldblock))
        FROM {assembly}_gwas as gwas,
        {assembly}_cre_all as cre,
        {assembly}_gwas_overlap as over
        WHERE gwas.authorPubmedTrait = over.authorPubmedTrait
        AND cre.accession = over.accession
        AND int4range(gwas.start, gwas.stop) && int4range(cre.start, cre.stop)
        AND gwas.authorPubmedTrait = %s
        """.format(assembly=self.assembly),
                                (gwas_study, ))
        return row[0]

    def gwasAccessions(self, gwas_study):
        rows = self.pw.fetchall("gwasAccessions", """
        SELECT accession
        FROM {tn}
        where authorPubmedTrait = %s
        """.format(tn=self.assembly + "_gwas_overlap"),
                                (gwas_study, ))
        return [r[0] for r in rows]

    def numCresOverlap(self, gwas_study):
        rows = self.pw.fetchall("numCresOverlap", """
        SELECT count(0)
        FROM (
        SELECT DISTINCT ACCESSION
        FROM {tn}
        where authorPubmedTrait = %s
        ) accessions
        """.format(tn=self.assembly + "_gwas_overlap"),
                                (gwas_study, ))
        return [r[0] for r in rows]

    def gwasPercentActive(self, gwas_study, ct, json = None):
        fields = ["cre.accession", "array_agg(snp)",
                  PGcreTable._getInfo(),
                  "infoAll.approved_symbol AS geneid",
                  "cre.start", "cre.stop", "cre.chrom",
                  "cre.gene_all_id", "cre.gene_pc_id"]
        groupBy = ["cre.accession", "cre.start", "cre.stop",
                   "cre.chrom", "cre.gene_all_id", "cre.gene_pc_id",
                   "infoAll.approved_symbol"] + [v for k, v in PGcreTable.infoFields.items()]

        if ct in self.ctsTable:
            fields.append("cre.creGroupsSpecific[%s] AS cts" %
                          self.ctsTable[ct])
            groupBy.append("cre.creGroupsSpecific[%s]" %
                           self.ctsTable[ct])
        else:
            fields.append("0::int AS cts")

        fieldsOut = ["accession", "snps", "info", "geneid",
                     "start", "stop", "chrom", "gene_all_id", "gene_pc_id", "cts"]
        for assay in [("dnase", "dnase"),
                      ("promoter", "h3k4me3"),
                      ("enhancer", "h3k27ac"),
                      ("ctcf", "ctcf")]:
            if ct not in self.ctmap[assay[0]]:
                continue
            cti = self.ctmap[assay[0]][ct]
            fieldsOut.append(assay[0] + " zscore")
            fields.append("cre.%s_zscores[%d] AS %s_zscore" %
                          (assay[1], cti, assay[0]))
            groupBy.append("cre.%s_zscores[%d]" %
                           (assay[1], cti))

        if not json:
            return self._gwasPercentActiveRun(gwas_study, json, fields, groupBy)
        return self._gwasPercentActiveRunJson(gwas_study, json, fields, groupBy)

    def _gwasPercentActiveRun(self, gwas_study, json, fields, groupBy):
        rows = self.pw.fetchall("_gwasPercentActiveRun", """
        SELECT {fields}
        FROM {assembly}_cre_all as cre,
        {assembly}_gwas_overlap as over,
        {assembly}_gene_info as infoAll
        WHERE cre.gene_all_id[1] = infoAll.geneid
        AND cre.accession = over.accession
        AND over.authorPubmedTrait = %s
        GROUP BY {groupBy}
        """.format(assembly=self.assembly,
                   fields=', '.join(fields),
                   groupBy=', '.join(groupBy)),
                                (gwas_study, ))
        ret = [dict(list(zip(fieldsOut, r))) for r in rows]
        for r in range(len(ret)):
            ret[r].update({
                "ctspecifc": {
                    "%s_zscore" % x: ret[r]["%s zscore" % x] if "%s zscore" % x in ret[r] else None
                    for x in ["dnase", "promoter", "enhancer", "ctcf"]
                }
            })
        return ret, fieldsOut
            
    def _gwasPercentActiveRunJson(self, gwas_study, json, fields, groupBy):
        q = self.pw.mogrify("_gwasPercentActiveRunJson", """
        copy (
        SELECT JSON_AGG(r) from (
        SELECT {fields}
        FROM {assembly}_cre_all as cre,
        {assembly}_gwas_overlap as over,
        {assembly}_gene_info as infoAll
        WHERE cre.gene_all_id[1] = infoAll.geneid
        AND cre.accession = over.accession
        AND over.authorPubmedTrait = %s
        GROUP BY {groupBy}
        ) r
        ) to STDOUT
        with DELIMITER E'\t' """.format(assembly = self.assembly,
                                        fields = ', '.join(fields),
                                        groupBy = ', '.join(groupBy)),
                            (gwas_study,))
        sf = io.StringIO()
        self.pw.copy_expert_file_handle(q, sf)
        sf.seek(0)
        with open(json, 'w') as f:
            for line in sf.readlines():
                f.write(line.replace(b'\\n', b''))
                

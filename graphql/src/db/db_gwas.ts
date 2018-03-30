import * as Common from './db_common';
import { db } from './db';
import { buildWhereStatement } from './db_cre_table';

export async function gwasStudies(assembly) {
    const tableName = assembly + '_gwas_studies';
    const q = `
        SELECT authorpubmedtrait as value, author, pubmed, trait, numLDblocks as total_ldblocks
        FROM ${tableName}
        ORDER BY trait
    `;
    const res = await db.any(q);
    const keys = ['value', 'author', 'pubmed', 'trait', 'total_ldblocks'];
    return res.map(r => keys.reduce((obj, key) => ({ ...obj, [key]: r[key] }), {}));
}

export async function numLdBlocksOverlap(assembly, gwas_study) {
    const q = `
        SELECT COUNT(DISTINCT(ldblock))
        FROM ${assembly}_gwas as gwas,
        ${assembly}_cre_all as cre,
        ${assembly}_gwas_overlap as over
        WHERE gwas.authorPubmedTrait = over.authorPubmedTrait
        AND cre.accession = over.accession
        AND int4range(gwas.start, gwas.stop) && int4range(cre.start, cre.stop)
        AND gwas.authorPubmedTrait = $1
    `;
    return await db.oneOrNone(q, [gwas_study], r => r ? +r.count : 0);
}

export async function numCresOverlap(assembly, gwas_study) {
    const tableName = assembly + '_gwas_overlap';
    const q = `
        SELECT count(0)
        FROM ${tableName}
        where authorPubmedTrait = $1
    `;
    return await db.oneOrNone(q, [gwas_study], r => r ? +r.count : 0);
}

export async function gwasEnrichment(assembly, gwas_study): Promise<{ [col: string]: any } | undefined> {
    const tableNamefdr = assembly + '_gwas_enrichment_fdr';
    const tableNamepval = assembly + '_gwas_enrichment_pval';
    const column_check = `
        SELECT EXISTS (SELECT 1
        FROM information_schema.columns
        WHERE table_name='${tableNamefdr}' and column_name='${gwas_study.toLowerCase()}')
        UNION ALL
        SELECT EXISTS (SELECT 1
        FROM information_schema.columns
        WHERE table_name='${tableNamepval}' and column_name='${gwas_study.toLowerCase()}');
    `;
    const colcheck = await db.any(column_check);
    if (colcheck.some(r => !r.exists)) {
        console.log('Not exists.', gwas_study);
        return undefined;
    }
    const q = `
        SELECT fdr.expID, fdr.cellTypeName as ct, fdr.biosample_summary,
        fdr.${gwas_study} as fdr,
        pval.${gwas_study} as pval
        FROM ${tableNamefdr} fdr
        INNER JOIN ${tableNamepval} pval
        ON fdr.expid = pval.expid
        ORDER BY fdr DESC, pval
    `;
    const res = await db.any(q);
    const cols = ['expID', 'ct', 'biosample_summary', 'fdr', 'pval'];
    return res.map(r => cols.reduce((obj, key) => ({ ...obj, [key]: r[key.toLowerCase()] }), {}));
}

const infoFields = {
    'accession': 'cre.accession',
    'isproximal': 'cre.isproximal',
    'dnasemax': 'cre.dnase_max',
    'k4me3max': 'cre.h3k4me3_max',
    'k27acmax': 'cre.h3k27ac_max',
    'ctcfmax': 'cre.ctcf_max',
    'concordant': 'cre.concordant'
};

function getInfo(fields) {
    for (const k of Object.keys(infoFields)) {
        fields.push(`${infoFields[k]} as ${k}`);
    }
}

export async function gwasPercentActive(assembly, gwas_study, ct: string | undefined, ctmap, ctsTable) {
    const { fields, groupBy, where, params } = buildWhereStatement(ctmap, { cellType: ct }, undefined, undefined, undefined, {});
    const q = `
        SELECT ${fields}, array_agg(snp) as snps, infoAll.approved_symbol AS geneid
        FROM ${assembly}_cre_all as cre,
        ${assembly}_gwas_overlap as over,
        ${assembly}_gene_info as infoAll
        WHERE cre.gene_all_id[1] = infoAll.geneid
        AND cre.accession = over.accession
        AND over.authorPubmedTrait = $1
        GROUP BY ${groupBy}, infoAll.approved_symbol
    `;

    const res = await db.any(q, [gwas_study]);
    return { cres: res.map(r => ({ ...r, assembly })) };
}

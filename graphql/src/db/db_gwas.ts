import * as Common from '../db/db_common';

const executeQuery = require('./db').executeQuery;

export async function gwasStudies(assembly) {
    const tableName = assembly + '_gwas_studies';
    const q = `
        SELECT authorpubmedtrait as value, author, pubmed, trait, numLDblocks as total_ldblocks
        FROM ${tableName}
        ORDER BY trait
        `;
    const res = await executeQuery(q);
    const keys = ['value', 'author', 'pubmed', 'trait', 'total_ldblocks'];
    return res.rows.map(r => keys.reduce((obj, key) => ({ ...obj, [key]: r[key] }), {}));
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
        AND gwas.authorPubmedTrait = '${gwas_study}'
    `;
    const res = await executeQuery(q);
    return res.rows[0]['count'];
}

export async function numCresOverlap(assembly, gwas_study) {
    const tableName = assembly + '_gwas_overlap';
    const q = `
        SELECT count(0)
        FROM ${tableName}
        where authorPubmedTrait = '${gwas_study}'
    `;
    const res = await executeQuery(q);
    return res.rows.map(r => r['count']);
}

export async function gwasEnrichment(assembly, gwas_study) {
    const tableNamefdr = assembly + '_gwas_enrichment_fdr';
    const tableNamepval = assembly + '_gwas_enrichment_pval';
    const q = `
        SELECT fdr.expID, fdr.cellTypeName, fdr.biosample_summary,
        fdr.${gwas_study} as fdr,
        pval.${gwas_study} as pval
        FROM ${tableNamefdr} fdr
        INNER JOIN ${tableNamepval} pval
        ON fdr.expid = pval.expid
        ORDER BY fdr DESC, pval
    `;
    const res = await executeQuery(q);
    const cols = ['expID', 'cellTypeName', 'biosample_summary', 'fdr', 'pval'];
    return res.rows.map(r => cols.reduce((obj, key) => ({ ...obj, [key]: r[key] }), {}));
}

const infoFields = {
    'accession': 'cre.accession',
    'isproximal': 'cre.isproximal',
    'k4me3max': 'cre.h3k4me3_max',
    'k27acmax': 'cre.h3k27ac_max',
    'ctcfmax': 'cre.ctcf_max',
    'concordant': 'cre.concordant'
};

function getInfo() {
    const infopairs: Array<string> = [];
    for (const k of Object.keys(infoFields)) {
        infopairs.push(`'${k}', ${infoFields[k]}`);
    }
    const infofield = 'json_build_object(' + infopairs.join(',') + ') as info';
    return infofield;
}

export async function gwasPercentActive(assembly, gwas_study, ct, ctmap, ctsTable) {
    const fields = [
        'cre.accession',
        'array_agg(snp)',
        getInfo(),
        'infoAll.approved_symbol AS geneid',
        'cre.start',
        'cre.stop',
        'cre.chrom'
    ];
    const groupBy = [
        'cre.accession',
        'cre.start',
        'cre.stop',
        'cre.chrom',
        'infoAll.approved_symbol'
    ].concat(Object.keys(infoFields).map(k => infoFields[k]));

    if (ct in ctsTable) {
        fields.push(`cre.creGroupsSpecific[${ctsTable[ct]}] AS cts`);
        groupBy.push(`cre.creGroupsSpecific[${ctsTable[ct]}]`);
    } else {
        fields.push('0::int AS cts');
    }

    const fieldsOut = ['accession', 'snps', 'info', 'geneid', 'start', 'stop', 'chrom', 'cts'];
    for (const assay of [
            ['dnase', 'dnase'],
            ['promoter', 'h3k4me3'],
            ['enhancer', 'h3k27ac'],
            ['ctcf', 'ctcf']
        ]) {
        if (!(ct in ctmap[assay[0]])) {
            continue;
        }
        const cti = ctmap[assay[0]][ct];
        fieldsOut.push(assay[0] + ' zscore');
        fields.push(`cre.${assay[1]}_zscores[${cti}] AS ${assay[0]}_zscore`);
        groupBy.push(`cre.${assay[1]}_zscores[${cti}]`);
    }

    const q = `
        SELECT ${fields.join(', ')}
        FROM ${assembly}_cre_all as cre,
        ${assembly}_gwas_overlap as over,
        ${assembly}_gene_info as infoAll
        WHERE cre.gene_all_id[1] = infoAll.geneid
        AND cre.accession = over.accession
        AND over.authorPubmedTrait = '${gwas_study}'
        GROUP BY ${groupBy.join(', ')}
    `;
    const res = await executeQuery(q);
    const ret = res.rows.map(r => fieldsOut.reduce((obj, key) => ({ ...obj, [key]: r[key] }), {}));
    for (const k of Object.keys(ret)) {
        const newObj = ret[k];
        newObj['ctspecific'] = newObj['ctspecific'] || {};
        for (const x of ['dnase', 'promoter', 'enhancer', 'ctcf']) {
            newObj['ctspecific'][`${x}_zscore`] = ret[k][`${x}_zscore`];
        }
        ret[k] = newObj;
    }
    return { cres: ret, fieldsOut };
}

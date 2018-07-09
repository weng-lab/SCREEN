import * as Common from './db_common';
import { db } from './db';
import { buildWhereStatement, dbcre, getCreTable } from './db_cre_table';
import { Assembly, SNP, LDBlockSNP } from '../types';
import { LDBlock } from '../schema/GwasResponse';
import { Gwas } from '../resolvers/gwas';
import { loadCache, ccRECtspecificLoaders } from './db_cache';
import { snptable } from './db_snp';

export type DBGwasStudy = { name: string; author: string; pubmed: string; trait: string; totalLDblocks: number };
export async function gwasStudies(assembly): Promise<DBGwasStudy[]> {
    const tableName = assembly + '_gwas_studies';
    const q = `
        SELECT authorpubmedtrait as name, author, pubmed, trait, numLDblocks as totalLDblocks
        FROM ${tableName}
        ORDER BY trait
    `;
    return db.map<DBGwasStudy>(q, [], row => ({ ...row, totalLDblocks: row.totalldblocks }));
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
    return await db.oneOrNone(q, [gwas_study], r => (r ? +r.count : 0));
}

export async function numCresOverlap(assembly, gwas_study) {
    const tableName = assembly + '_gwas_overlap';
    const q = `
        SELECT count(0)
        FROM (
            SELECT DISTINCT accession
            FROM ${tableName}
            where authorPubmedTrait = $1
        ) accessions
    `;
    return await db.oneOrNone(q, [gwas_study], r => (r ? +r.count : 0));
}

export async function gwasEnrichment(
    assembly,
    gwas_study
): Promise<{ expID: string; ct: string; biosample_summary: string; fdr: number; pval: number }[] | undefined> {
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
        ORDER BY fdr ASC, pval
    `;
    const res = await db.any(q);
    const cols = ['expID', 'ct', 'biosample_summary', 'fdr', 'pval'];
    return res.map(r => cols.reduce((obj, key) => ({ ...obj, [key]: r[key.toLowerCase()] }), {} as any));
}

const infoFields = {
    accession: 'cre.accession',
    isproximal: 'cre.isproximal',
    dnasemax: 'cre.dnase_max',
    k4me3max: 'cre.h3k4me3_max',
    k27acmax: 'cre.h3k27ac_max',
    ctcfmax: 'cre.ctcf_max',
    concordant: 'cre.concordant',
};

function getInfo(fields) {
    for (const k of Object.keys(infoFields)) {
        fields.push(`${infoFields[k]} as ${k}`);
    }
}

export type gwascre = dbcre & {
    snps: string[];
    geneid: string;
};

export async function gwasPercentActive(assembly, gwas_study, ct: string | undefined, ctmap): Promise<gwascre[]> {
    const { fields, groupBy, where, params } = buildWhereStatement(
        assembly,
        ctmap,
        {},
        undefined,
        undefined,
        undefined,
        {}
    );
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

    return db.any(q, [gwas_study]);
}

export type DBLDBlockSNP = {
    authorpubmedtrait: string;
    snp: string;
    chrom: string;
    start: number;
    stop: number;
    taggedsnp: string;
    r2: number[];
    ldblock: string;
};
export async function gwasLDBlockSNPBySNP(assembly: Assembly, snp_id: string, gwas_obj: Gwas): Promise<LDBlockSNP[]> {
    const tableName = `${assembly}_gwas`;
    const q = `
SELECT authorpubmedtrait, snp, chrom, start, stop, taggedsnp, r2, ldblock
FROM ${tableName}
WHERE snp = $1
    `;

    const res = await db.any(q, [snp_id]);
    return mapldblocksnps(assembly, gwas_obj)(res);
}

const mapldblocksnps = (assembly: Assembly, gwas_obj: Gwas) => (rows: DBLDBlockSNP[]): LDBlockSNP[] => {
    const map = (row, tagged, r2): LDBlockSNP => ({
        r2: r2,
        snp: {
            assembly,
            id: row.snp,
            range: {
                chrom: row.chrom,
                start: row.start,
                end: row.stop,
            },
        },
        ldblock: {
            assembly,
            name: row.ldblock,
            study: {
                study_name: row.authorpubmedtrait,
                gwas_obj,
                ...gwas_obj.byStudy[row.authorpubmedtrait],
            },
            taggedsnp: tagged,
        },
    });
    const snps: LDBlockSNP[] = [];
    rows.forEach(row => {
        row.taggedsnp.split(',').forEach((tagged, index) => {
            const mapped = map(row, tagged, row.r2[index]);
            snps.push(mapped);
        });
    });
    return snps;
};

export async function SNPsInLDBlock(assembly: Assembly, ldblock_name: string, gwas_obj: Gwas): Promise<LDBlockSNP[]> {
    const tableName = `${assembly}_gwas`;
    const q = `
SELECT DISTINCT snp, authorpubmedtrait, chrom, start, stop, taggedsnp, r2, ldblock
FROM ${tableName}
WHERE ldblock = $1
    `;
    const res = await db.any(q, [ldblock_name]);
    return mapldblocksnps(assembly, gwas_obj)(res);
}

export async function allSNPsInStudy(assembly: Assembly, study_name: string, gwas_obj: Gwas): Promise<LDBlockSNP[]> {
    const tableName = `${assembly}_gwas`;
    const q = `
SELECT DISTINCT snp, authorpubmedtrait, chrom, start, stop, taggedsnp, r2, ldblock
FROM ${tableName}
WHERE authorPubmedTrait = $1
    `;
    const res = await db.any(q, [study_name]);
    return mapldblocksnps(assembly, gwas_obj)(res);
}

export async function searchSNPs(assembly: Assembly, snpPartial: string): Promise<SNP[]> {
    const tableName = assembly + '_gwas';
    const q = `
SELECT DISTINCT snp, chrom, start, stop, similarity(snp, '${snpPartial}') as sm
FROM ${tableName}
WHERE snp LIKE '${snpPartial}%'
ORDER BY sm DESC
LIMIT 10
    `;
    return db.map<SNP>(q, [], snp => ({
        assembly,
        id: snp.snp,
        range: {
            chrom: snp.chrom,
            start: snp.start,
            end: snp.stop,
        },
    }));
}

export async function activeBiosamples(assembly: Assembly, snp: string, study: string) {
    const enrichedbiosamples = await gwasEnrichment(assembly, study);
    if (!enrichedbiosamples) {
        return undefined;
    }
    const intersectq = `
SELECT DISTINCT accession
FROM ${assembly}_gwas_overlap
WHERE snp = $1
    `;
    const intersectingccres = await db.map<string>(intersectq, [snp], row => row.accession);
    const allactivects = new Set<string>();
    for (const ccre of intersectingccres) {
        const cts = await Common.activeCts(assembly, ccre, ['dnase', 'h3k4me3', 'h3k27ac']);
        for (const ct of cts) {
            allactivects.add(ct);
        }
    }

    const enrichedandactive = enrichedbiosamples.filter(biosample => allactivects.has(biosample.ct));
    const datasets = await loadCache(assembly).datasets();
    return enrichedandactive.map(ct => ({ ...ct, ct: datasets.byCellTypeValue[ct.ct] }));
}

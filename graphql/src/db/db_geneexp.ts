import { db } from './db';
import TissueColors from '../tissuecolors';
import { natsorter } from '../utils';
import { Assembly } from '../types';

const fixedmap = {
    limb: 'limb',
    'embryonic facial prominence': 'embryonic structure',
    'CH12.LX': 'blood',
    'neural tube': 'neural tube',
    intestine: 'intestine',
    'hematopoietic stem cell': 'blood',
    G1E: 'embryonic stem cell',
    MEP: 'blood',
    'G1E-ER4': 'embryonic stem cell',
    CMP: 'blood',
};

const doLog = d => {
    return parseFloat(Math.log2(parseFloat(d) + 0.01).toFixed(2));
};

const mapRep = (rep: { replicate: number; tpm: number; fpkm: number; id: string }) => ({
    replicate: rep.replicate,
    rawTPM: rep.tpm,
    logTPM: doLog(rep.tpm),
    rawFPKM: rep.fpkm,
    logFPKM: doLog(rep.fpkm),
    rID: rep.id,
});

const makeEntry = row => {
    let tissue = row['organ'].trim();

    if (tissue === '{}') {
        tissue = row['cellType'] in fixedmap ? fixedmap[row['cellType']] : '';
    }

    const reps = row.reps.map(mapRep);
    const avgtpm = reps.map(r => r.rawTPM).reduce((a, b) => a + b) / reps.length;
    const avgfpkm = reps.map(r => r.rawFPKM).reduce((a, b) => a + b) / reps.length;
    reps.push({
        replicate: 'mean',
        rawTPM: avgtpm,
        logTPM: doLog(avgtpm),
        rawFPKM: avgfpkm,
        logFPKM: doLog(avgfpkm),
        rID: reps.map(r => r.rID).join(','),
    });
    return {
        tissue: tissue,
        cellType: row['celltype'],
        expID: row['expid'],
        ageTitle: row['agetitle'],
        gene_name: row['gene_name'],
        ensemblid_ver: row['ensemblid_ver'],
        reps: reps,
    };
};

export const computeHorBarsAll = async (assembly, gene, compartments, biosample_types, normalized) => {
    const tableNameData = assembly + (normalized ? '_rnaseq_expression_norm' : '_rnaseq_expression_unnorm');
    const tableNameMetadata = assembly + '_rnaseq_metadata';
    const q = `
        SELECT
        r.expid,
        meta.organ,
        meta.cellType,
        meta.ageTitle,
        json_agg(json_build_object('replicate', r.replicate, 'tpm', r.tpm, 'fpkm', r.fpkm, 'id', r.id)) as reps
        FROM ${tableNameData} AS r
        INNER JOIN ${tableNameMetadata} AS meta ON meta.expid = r.expid AND meta.replicate = r.replicate
        WHERE gene_name = '${gene}'
        AND meta.cellCompartment = ANY ($1)
        AND meta.biosample_type = ANY ($2)
        GROUP BY
        meta.organ,
        meta.cellType,
        meta.ageTitle,
        r.expid
    `;
    const res = await db.any(q, [compartments, biosample_types]);
    return res.map(makeEntry);
};

export const geneexp_bygene = (
    biosample: string | undefined,
    table_expresssion: string,
    table_metadata: string
): string => {
    return `
SELECT r.ensembl_id as ensemblid_ver, r.gene_name, r.expid, meta.organ, meta.cellType, meta.ageTitle, json_agg(json_build_object('replicate', r.replicate, 'tpm', r.tpm, 'fpkm', r.fpkm)) as reps
FROM ${table_expresssion} AS r
INNER JOIN ${table_metadata} AS meta ON r.expid = meta.expid AND r.replicate = meta.replicate
WHERE
    meta.cellCompartment = ANY ($<compartments>)
    AND meta.biosample_type = ANY ($<biosampletypes>)
    AND r.gene_name = $<gene>
    ${biosample ? `AND meta.celltype = $<biosample>` : ''}
GROUP BY ensembl_id, meta.organ, meta.cellType, meta.ageTitle, r.expid, r.gene_name
    `;
};

export const geneexp_bybiosample = (pconly: boolean, nomitochondrial: boolean, table_allmv: string): string => {
    return `
SELECT ensembl_id as ensemblid_ver, gene_name, expid, organ, cellType, ageTitle, gene_type, mitochondrial, reps
FROM ${table_allmv} as r
WHERE
    r.cellcompartment = ANY ($<compartments>)
    AND r.ensembl_id = ANY (
        SELECT ensembl_id
        FROM (
            SELECT percentile_cont(0.5) WITHIN GROUP(ORDER BY tpm_avg) as median, ensembl_id
            FROM ${table_allmv} as r
            WHERE
                r.cellcompartment = ANY ($<compartments>)
                AND r.celltype = $<biosample>
                ${pconly ? `AND gene_type = 'protein_coding'` : ''}
                ${nomitochondrial ? `AND mitochondrial = False` : ''}
            GROUP BY ensembl_id
            ORDER BY median desc
            LIMIT 100
        ) median_ranked
    )
    AND r.celltype = $<biosample>
    ${pconly ? `AND gene_type = 'protein_coding'` : ''}
    ${nomitochondrial ? `AND mitochondrial = False` : ''}
    `;
};

export const geneexp_byexperiment = (pconly: boolean, nomitochondrial: boolean, table_allmv: string) => {
    return `
SELECT ensembl_id as ensemblid_ver, gene_name, expid, organ, cellType, ageTitle, gene_type, mitochondrial, reps
FROM ${table_allmv} as r
WHERE
    r.cellcompartment = ANY ($<compartments>)
    AND r.ensembl_id = ANY (
        SELECT ensembl_id
        FROM (
            SELECT percentile_cont(0.5) WITHIN GROUP(ORDER BY tpm_avg) as median, ensembl_id
            FROM ${table_allmv} as r
            WHERE
                r.cellcompartment = ANY ($<compartments>)
                AND expid = $<experimentaccession>
                ${pconly ? `AND gene_type = 'protein_coding'` : ''}
                ${nomitochondrial ? `AND mitochondrial = False` : ''}
            GROUP BY ensembl_id
            ORDER BY median desc
            LIMIT 100
        ) median_ranked
    )
    AND r.celltype = $<biosample>
    AND r.expid = $<experimentaccession>
    ${pconly ? `AND gene_type = 'protein_coding'` : ''}
    ${nomitochondrial ? `AND mitochondrial = False` : ''}
    `;
};

interface GeneExpFunction {
    (
        assembly: Assembly,
        gene: string,
        biosample: string | undefined,
        experimentaccession: undefined,
        compartments: string[],
        biosample_types: string[],
        normalized: boolean,
        pconly: boolean,
        nomitochondrial: boolean
    );
    (
        assembly: Assembly,
        gene: undefined,
        biosample: string,
        experimentaccession: undefined,
        compartments: string[],
        biosample_types: string[],
        normalized: boolean,
        pconly: boolean,
        nomitochondrial: boolean
    );
    (
        assembly: Assembly,
        gene: undefined,
        biosample: undefined,
        experimentaccession: string,
        compartments: string[],
        biosample_types: string[],
        normalized: boolean,
        pconly: boolean,
        nomitochondrial: boolean
    );
}
export const geneexp: GeneExpFunction = async (
    assembly: Assembly,
    gene: string | undefined,
    biosample: string | undefined,
    experimentaccession: string | undefined,
    compartments: string[],
    biosample_types: string[],
    normalized: boolean,
    pconly: boolean,
    nomitochondrial: boolean
) => {
    const allmv = `${assembly}_rnaseq_${normalized ? 'norm' : 'unnorm'}_mv`;
    const expression = `${assembly}_rnaseq_expression_${normalized ? 'norm' : 'unnorm'}`;
    const metadata = `${assembly}_rnaseq_metadata`;

    let query;
    if (gene) {
        query = geneexp_bygene(biosample, expression, metadata);
    } else if (experimentaccession) {
        query = geneexp_byexperiment(pconly, nomitochondrial, allmv);
    } else if (biosample) {
        query = geneexp_bybiosample(pconly, nomitochondrial, allmv);
    }

    const params = {
        compartments,
        biosampletypes: biosample_types,
        gene,
        biosample,
        experimentaccession,
    };

    const res = await db.any(query, params);
    return res.map(makeEntry);
};

export const biosample_types: GeneExpFunction = async (
    assembly: Assembly,
    gene: string | undefined,
    biosample: string | undefined,
    experimentaccession: string | undefined,
    compartments: string[],
    biosample_types: string[],
    normalized: boolean,
    pconly: boolean,
    nomitochondrial: boolean
) => {
    const allmv = `${assembly}_rnaseq_${normalized ? 'norm' : 'unnorm'}_mv`;
    const expression = `${assembly}_rnaseq_expression_${normalized ? 'norm' : 'unnorm'}`;
    const metadata = `${assembly}_rnaseq_metadata`;

    let query;
    if (gene) {
        query = `
SELECT biosample_type
FROM ${expression} AS r
INNER JOIN ${metadata} AS meta ON r.expid = meta.expid AND r.replicate = meta.replicate
WHERE
    meta.cellCompartment = ANY ($<compartments>)
    AND meta.biosample_type = ANY ($<biosampletypes>)
    AND r.gene_name = $<gene>
    ${biosample ? `AND r.celltype = $<biosample>` : ''}
GROUP BY biosample_type
        `;
    } else if (experimentaccession) {
        query = `
SELECT biosample_type
FROM ${allmv} as r
WHERE
    r.cellcompartment = ANY ($<compartments>)
    AND r.celltype = $<biosample>
    ${pconly ? `AND gene_type = 'protein_coding'` : ''}
    ${nomitochondrial ? `AND mitochondrial = False` : ''}
GROUP BY biosample_type
        `;
    } else if (biosample) {
        query = `
SELECT biosample_type
FROM ${allmv} as r
WHERE
    r.cellcompartment = ANY ($<compartments>)
    AND r.celltype = $<biosample>
    AND r.expid = $<experimentaccession>
    ${pconly ? `AND gene_type = 'protein_coding'` : ''}
    ${nomitochondrial ? `AND mitochondrial = False` : ''}
GROUP BY biosample_type
    `;
    }

    const params = {
        compartments,
        biosampletypes: biosample_types,
        gene,
        biosample,
        experimentaccession,
    };

    const res = await db.any(query, params);
    return res.map(r => r.biosample_type);
};

export const cell_compartments: GeneExpFunction = async (
    assembly: Assembly,
    gene: string | undefined,
    biosample: string | undefined,
    experimentaccession: string | undefined,
    compartments: string[],
    biosample_types: string[],
    normalized: boolean,
    pconly: boolean,
    nomitochondrial: boolean
) => {
    const allmv = `${assembly}_rnaseq_${normalized ? 'norm' : 'unnorm'}_mv`;
    const expression = `${assembly}_rnaseq_expression_${normalized ? 'norm' : 'unnorm'}`;
    const metadata = `${assembly}_rnaseq_metadata`;

    let query;
    if (gene) {
        query = `
SELECT cellcompartment
FROM ${expression} AS r
INNER JOIN ${metadata} AS meta ON r.expid = meta.expid AND r.replicate = meta.replicate
WHERE
    meta.cellCompartment = ANY ($<compartments>)
    AND meta.biosample_type = ANY ($<biosampletypes>)
    AND r.gene_name = $<gene>
    ${biosample ? `AND r.celltype = $<biosample>` : ''}
GROUP BY cellcompartment
        `;
    } else if (experimentaccession) {
        query = `
SELECT cellcompartment
FROM ${allmv} as r
WHERE
    r.cellcompartment = ANY ($<compartments>)
    AND r.celltype = $<biosample>
    ${pconly ? `AND gene_type = 'protein_coding'` : ''}
    ${nomitochondrial ? `AND mitochondrial = False` : ''}
GROUP BY cellcompartment
        `;
    } else if (biosample) {
        query = `
SELECT cellcompartment
FROM ${allmv} as r
WHERE
    r.cellcompartment = ANY ($<compartments>)
    AND r.celltype = $<biosample>
    AND r.expid = $<experimentaccession>
    ${pconly ? `AND gene_type = 'protein_coding'` : ''}
    ${nomitochondrial ? `AND mitochondrial = False` : ''}
GROUP BY cellcompartment
    `;
    }

    const params = {
        compartments,
        biosampletypes: biosample_types,
        gene,
        biosample,
        experimentaccession,
    };

    const res = await db.any(query, params);
    return res.map(r => r.cellcompartment);
};

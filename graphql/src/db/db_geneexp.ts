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
    const ranksmv = `${assembly}_rnaseq_${normalized ? 'norm' : 'unnorm'}_ranks_mv`;

    let query;
    if (gene) {
        query = `
SELECT r.ensembl_id as ensemblid_ver, r.gene_name, r.expid, r.organ, r.cellType, r.ageTitle, json_agg(json_build_object('replicate', r.replicate, 'tpm', r.tpm, 'fpkm', r.fpkm)) as reps
FROM ${allmv} AS r
WHERE
    r.cellCompartment = ANY ($<compartments>)
    AND r.biosample_type = ANY ($<biosampletypes>)
    AND gene_name = $<gene>
    ${biosample ? `AND r.celltype = $<biosample>` : ''}
GROUP BY ensembl_id, r.organ, r.cellType, r.ageTitle, r.expid, r.gene_name
    `;
    } else if (experimentaccession) {
        query = `
SELECT r.ensembl_id as ensemblid_ver, r.gene_name, r.expid, r.organ, r.cellType, r.ageTitle, json_agg(json_build_object('replicate', r.replicate, 'tpm', r.tpm, 'fpkm', r.fpkm)) as reps, MAX(tpm) as maxtpm
FROM ${allmv} AS r
WHERE
    expid = $<experimentaccession>
    ${pconly ? `AND gene_type = 'protein_coding'` : ''}
    ${nomitochondrial ? `AND mitochondrial = False` : ''}
GROUP BY ensembl_id, r.organ, r.cellType, r.ageTitle, r.expid, r.gene_name
ORDER BY maxtpm desc
LIMIT 100
        `;
    } else if (biosample) {
        query = `
SELECT ensembl_id as ensemblid_ver, gene_name, expid, organ, cellType, ageTitle, json_agg(json_build_object('replicate', replicate, 'tpm', tpm, 'fpkm', fpkm)) as reps
FROM (
    SELECT *
    FROM ${allmv} as r
    WHERE
        r.cellcompartment = ANY ($<compartments>)
        AND r.ensembl_id = ANY (
            SELECT top.ensembl_id
            FROM ${ranksmv} top
            WHERE celltype = $<biosample>
            AND cellcompartment = ANY ($<compartments>)
            ${pconly ? `AND gene_type = 'protein_coding'` : ''}
            ${nomitochondrial ? `AND mitochondrial = False` : ''}
            GROUP BY ensembl_id
            ORDER BY MAX(maxtpm) DESC
            LIMIT 100
        )
        AND r.celltype = $<biosample>
        AND r.tpm > 0
) singles
GROUP BY ensembl_id, organ, celltype, agetitle, gene_name, expid
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
    return res.map(makeEntry);
};

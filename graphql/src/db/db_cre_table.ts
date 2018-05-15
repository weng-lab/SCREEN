import { Client } from 'pg';
import { checkChrom, isaccession, isclose } from '../utils';
import { db, pgp } from './db';

const { UserError } = require('graphql-errors');

const accessions = (wheres, params, j: { accessions?: string[] }) => {
    const accs: Array<string> = j['accessions'] || [];
    if (0 == accs.length) {
        return false;
    }
    params.accsList = accs.filter(isaccession).map(a => a.toUpperCase());
    const accsQuery = 'accession = ANY (${accsList})';
    wheres.push(`(${accsQuery})`);
    return true;
};

const notCtSpecificRanks = (wheres, params, j) => {
    j = j.ctexps || {};
    // use max zscores
    const map = {
        dnase: 'dnase_max',
        promoter: 'h3k4me3_max',
        enhancer: 'h3k27ac_max',
        ctcf: 'ctcf_max',
    };
    for (const name of Object.keys(map)) {
        const exp = map[name];
        if (`rank_${name}_start` in j || `rank_${name}_end` in j) {
            const minDefault = -10.0; // must match slider default
            const maxDefault = 10.0; // must match slider default
            const start = j[`rank_${name}_start`] || minDefault;
            const end = j[`rank_${name}_end`] || maxDefault;
            let startWhere;
            let endWhere;
            if (!isclose(start, minDefault)) {
                startWhere = `cre.${map[name]} >= $<rank_${name}_start>`;
                params[`rank_${name}_start`] = start;
            }
            if (!isclose(end, maxDefault)) {
                endWhere = `cre.${map[name]} <= $<rank_${name}_end>`;
                params[`rank_${name}_end`] = end;
            }
            if (startWhere && endWhere) {
                wheres.push(`(${startWhere} and ${endWhere}`);
            } else if (startWhere) {
                wheres.push(`(${startWhere})`);
            } else if (endWhere) {
                wheres.push(`(${endWhere})`);
            }
        }
    }
};

const getCtSpecificOrderBy = (exp, ctindex) =>
    ({
        dnase: `cre.${exp}_zscores[${ctindex}] as dnase_zscore`,
        h3k4me3: `cre.${exp}_zscores[${ctindex}] as promoter_zscore`,
        h3k27ac: `cre.${exp}_zscores[${ctindex}] as enhancer_zscore`,
        ctcf: `cre.${exp}_zscores[${ctindex}] as ctcf_zscore`,
    }[exp]);
const ctexps = {
    dnase: 'dnase',
    promoter: 'h3k4me3',
    enhancer: 'h3k27ac',
    ctcf: 'ctcf',
};
const ctSpecificRanks = (wheres, fields, params, ct, j, ctmap) => {
    j = j.ctexps || {};
    for (const name of Object.keys(ctexps)) {
        const exp = ctexps[name];
        if (!(ct in ctmap[name])) {
            console.log(ct, 'not in ctmap ', name);
            continue;
        }
        const ctindex = ctmap[name][ct];
        // fields.push(getCtSpecificOrderBy(exp, ctindex));

        if (`rank_${name}_start` in j || `rank_${name}_end` in j) {
            const minDefault = -10.0; // must match slider default
            const maxDefault = 10.0; // must match slider default
            const start = j[`rank_${name}_start`] || minDefault;
            const end = j[`rank_${name}_end`] || maxDefault;
            let startWhere;
            let endWhere;
            if (!isclose(start, minDefault)) {
                startWhere = `cre.${exp}_zscores[${ctindex}] >= $<${exp}_zscores_${ctindex}_start>`;
                params[`${exp}_zscores_${ctindex}_start`] = start;
            }
            if (!isclose(end, maxDefault)) {
                endWhere = `cre.${exp}_zscores[${ctindex}] <= $<${exp}_zscores_${ctindex}_end>`;
                params[`${exp}_zscores_${ctindex}_end`] = end;
            }
            if (startWhere && endWhere) {
                wheres.push(`(${startWhere} and ${endWhere}`);
            } else if (startWhere) {
                wheres.push(`(${startWhere})`);
            } else if (endWhere) {
                wheres.push(`(${endWhere})`);
            }
        }
    }
};

const where = (wheres, params, chrom, start, stop) => {
    if (chrom) {
        wheres.push(`cre.chrom = $<chrom>`);
        params.chrom = chrom;
    }
    if (start && stop) {
        wheres.push(`int4range(cre.start, cre.stop) && int4range($<start>, $<stop>)`);
        params.start = start;
        params.stop = stop;
    }
};

export const buildWhereStatement = (
    assembly,
    ctmap,
    j: any,
    chrom: string | undefined,
    start: number | undefined,
    stop: number | undefined,
    pagination: any,
    extra?: { wheres: string[]; fields: string[] }
) => {
    const wheres = extra ? extra.wheres : [];
    const fields = [
        `'${assembly}' as assembly`,
        `cre.chrom as chrom`,
        `cre.start as start`,
        `cre.stop as end`,
        'cre.maxz',
        'cre.gene_all_id',
        'cre.gene_pc_id',
    ];
    extra && fields.push(...extra.fields);
    const groupBy = ['cre.chrom', 'cre.start', 'cre.stop', 'cre.maxz', 'cre.gene_all_id', 'cre.gene_pc_id'];
    const params: any = {};
    const useAccs = accessions(wheres, params, j);
    const ctexp = j.ctexps && j.ctexps.cellType;

    let orderBy;
    notCtSpecificRanks(wheres, params, j);
    if (useAccs || !ctexp) {
        switch (pagination.orderBy || 'maxz') {
            case 'dnase_zscore':
            case 'promoter_zscore':
            case 'enhancer_zscore':
            case 'ctcf_zscore':
                orderBy = 'maxz';
                break;
            default:
                orderBy = pagination.orderBy || 'maxz';
                break;
        }
    } else {
        let name;
        let col;
        switch (pagination.orderBy || 'maxz') {
            case 'dnase_zscore':
                name = 'dnase';
                col = 'dnase_zscores';
                break;
            case 'promoter_zscore':
                name = 'promoter';
                col = 'h3k4me3_zscores';
                break;
            case 'enhancer_zscore':
                name = 'enhancer';
                col = 'h3k27ac_zscores';
                break;
            case 'ctcf_zscore':
                name = 'ctcf';
                col = 'ctcf_zscores';
                break;
            default:
                name = undefined;
                orderBy = pagination.orderBy || 'maxz';
                break;
        }
        if (name) {
            if (!(ctexp in ctmap[name])) {
                orderBy = 'maxz';
            } else {
                const index = ctmap[name][ctexp];
                orderBy = `${col}[${index}]`;
            }
        }
        ctSpecificRanks(wheres, fields, params, ctexp, j, ctmap);
    }

    where(wheres, params, chrom, start, stop);

    const ct = j.ctspecific;
    // Ctspecific data
    if (ct) {
        const ctspecificfields: any[] = [];
        for (const name of Object.keys(ctexps)) {
            if (!(ct in ctmap[name])) {
                continue;
            }
            const ctindex = ctmap[name][ct];
            const exp = ctexps[name];
            fields.push(`cre.${exp}_zscores[${ctindex}] as ${name + '_zscore'}`);
            ctspecificfields.push(`cre.${exp}_zscores[${ctindex}]`);
            groupBy.push(`cre.${exp}_zscores[${ctindex}]`);
        }
        fields.push(`'${ct}' as ct`);
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
    for (const k of Object.keys(infoFields)) {
        fields.push(`${infoFields[k]} as ${k}`);
        groupBy.push(infoFields[k]);
    }

    const retfields = fields.join(', ');
    let retwhere = '';
    if (0 < wheres.length) {
        retwhere = 'WHERE ' + wheres.join(' and ');
    }
    return { fields: retfields, groupBy: groupBy.join(', '), where: retwhere, params, orderBy };
};

async function creTableEstimate(table, where, params) {
    // estimate count
    // from https://wiki.postgresql.org/wiki/Count_estimate
    const q = `
        SELECT count(0)
        FROM ${table} AS cre
        ${where}
        LIMIT 1
    `;

    return db.one(q, params, r => +r.count);
}

export type dbcre = {
    assembly: string;
    chrom: string;
    start: number;
    end: number;
    maxz: number;
    gene_all_id: number[];
    gene_pc_id: number[];
    ct: string;
    dnase_zscore?: number;
    promoter_zscore?: number;
    enhancer_zscore?: number;
    ctcf_zscore?: number;
    accession: string;
    isproximal: boolean;
    concordant: boolean;
    dnasemax?: number;
    k4me3max?: number;
    k27acmax?: number;
    ctcfmax?: number;
};

export async function getCreTable(
    assembly: string,
    cache,
    j,
    pagination,
    extra?: { wheres: string[]; fields: string[] }
): Promise<{ total: number; cres: dbcre[] }> {
    const chrom = j.range && checkChrom(assembly, j.range.chrom);
    const start = j.range && j.range.start;
    const end = j.range && j.range.end;
    const table = assembly + '_cre_all';
    const { fields, where, params, orderBy } = buildWhereStatement(
        assembly,
        cache.ctmap,
        j,
        chrom,
        start,
        end,
        pagination,
        extra
    );
    const offset = pagination.offset;
    const limit = pagination.limit;
    const query = `
        SELECT ${fields}
        FROM ${table} AS cre
        ${where}
        ORDER BY ${orderBy} DESC
        ${offset && offset !== 0 ? `OFFSET ${offset}` : ''}
        ${!!limit ? `LIMIT ${limit}` : ``}
    `;

    const res = await db.any(query, params);
    let total = res.length;
    if ((limit && limit <= total) || (offset || 0) !== 0) {
        // reached query limit
        total = await creTableEstimate(table, where, params);
    }
    return { cres: res, total: total };
}

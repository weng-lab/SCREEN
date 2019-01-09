import { Client } from 'pg';
import { checkChrom, isaccession, isclose } from '../utils';
import { db, pgp } from './db';
import { loadablecache, loadCache } from './db_cache';
import { ChromRange, Assembly, ctspecificdata } from '../types';

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

const notCtSpecificRanks = (wheres, params, j: { expmaxs?: any }) => {
    j = j.expmaxs || {};
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
            const maxDefault = name === 'dnase' ? 15.0 : 10.0; // must match slider default
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
                wheres.push(`(${startWhere} and ${endWhere})`);
            } else if (startWhere) {
                wheres.push(`(${startWhere})`);
            } else if (endWhere) {
                wheres.push(`(${endWhere})`);
            }
        }
    }
};

const ctexps = ['dnase', 'h3k4me3', 'h3k27ac', 'ctcf'];
const ctSpecificRanks = (wheres, fields, params, ct, j: { ctexps?: any }, ctmap) => {
    j = j.ctexps || {};
    for (const name of ctexps) {
        if (!(ct in ctmap[name])) {
            console.log(ct, 'not in ctmap ', name);
            continue;
        }
        const ctindex = ctmap[name][ct];

        if (`rank_${name}_start` in j || `rank_${name}_end` in j) {
            const minDefault = -10.0; // must match slider default
            const maxDefault = name === 'dnase' ? 15.0 : 10.0; // must match slider default
            const start = j[`rank_${name}_start`] || minDefault;
            const end = j[`rank_${name}_end`] || maxDefault;
            let startWhere;
            let endWhere;
            if (!isclose(start, minDefault)) {
                startWhere = `cre.${name}_zscores[${ctindex}] >= $<${name}_zscores_${ctindex}_start>`;
                params[`${name}_zscores_${ctindex}_start`] = start;
            }
            if (!isclose(end, maxDefault)) {
                endWhere = `cre.${name}_zscores[${ctindex}] <= $<${name}_zscores_${ctindex}_end>`;
                params[`${name}_zscores_${ctindex}_end`] = end;
            }
            if (startWhere && endWhere) {
                wheres.push(`(${startWhere} and ${endWhere})`);
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
    ctmap: Record<string, any>,
    j: { expmaxs?: any; ctexps?: any; accessions?: string[] },
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
            case 'maxz_ct':
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
                name = 'h3k4me3';
                col = 'h3k4me3_zscores';
                break;
            case 'enhancer_zscore':
                name = 'h3k27ac';
                col = 'h3k27ac_zscores';
                break;
            case 'ctcf_zscore':
                name = 'ctcf';
                col = 'ctcf_zscores';
                break;
            case 'maxz_ct':
                name = 'maxz_ct';
                col = undefined;
                break;
            default:
                name = undefined;
                orderBy = pagination.orderBy || 'maxz';
                break;
        }
        if (name) {
            if (name === 'maxz_ct') {
                // const index = ctmap['maxz_ct'][ctexp];
                // orderBy = `maxz_ct[${index}]`;
                orderBy = 'maxz';
            } else {
                if (!(ctexp in ctmap[name])) {
                    orderBy = 'maxz';
                } else {
                    const index = ctmap[name][ctexp];
                    orderBy = `${col}[${index}]`;
                }
            }
        }
        ctSpecificRanks(wheres, fields, params, ctexp, j, ctmap);
    }

    where(wheres, params, chrom, start, stop);

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
    h3k4me3_zscore?: number;
    h3k27ac_zscore?: number;
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
    ctmap: Record<string, any>,
    j: { ctexps?: any; accessions?: string[]; range?: Partial<ChromRange> },
    pagination,
    extra?: { wheres: string[]; fields: string[] }
): Promise<{ total: number; cres: dbcre[] }> {
    const chrom = j.range && checkChrom(assembly, j.range.chrom);
    const start = j.range && j.range.start;
    const end = j.range && j.range.end;
    const table = assembly + '_cre_all';
    const { fields, where, params, orderBy } = buildWhereStatement(
        assembly,
        ctmap,
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

export async function getCtSpecificData(assembly: Assembly, requested: string[]): Promise<ctspecificdata[]> {
    const table = assembly + '_cre_all';
    // ct => { ccres, indices }
    // Need to ensure that we return data in the same order that we were asked
    const ctrequests = requested.reduce(
        (prev, curr, index) => {
            const [ccre, ct] = curr.split('::');
            const obj = (prev[ct] = prev[ct] || {
                ccres: [],
                indices: {},
            });
            obj.ccres.push(ccre);
            obj.indices[ccre] = index;
            return prev;
        },
        {} as Record<string, { ccres: string[]; indices: Record<string, number> }>
    );

    const ctresults: Record<string, (ctspecificdata & { accession: string })[]> = {};
    for (const [ct, { ccres, indices }] of Object.entries(ctrequests)) {
        const fields: string[] = [];
        const ctmap = await loadCache(assembly).ctmap();
        const ctspecificfields: any[] = [];
        for (const name of ctexps) {
            if (!(ct in ctmap[name])) {
                continue;
            }
            const ctindex = ctmap[name][ct];
            fields.push(`cre.${name}_zscores[${ctindex}] as ${name + '_zscore'}`);
        }
        fields.push(`'${ct}' as ct`);
        fields.push('accession');
        const query = `
            SELECT ${fields}
            FROM ${table} AS cre
            WHERE accession = ANY($1)
        `;
        const res = await db.map(query, [ccres], result => {
            const { ct, accession, dnase_zscore, h3k4me3_zscore, h3k27ac_zscore, ctcf_zscore } = result;
            const maxz = Math.max(
                dnase_zscore || -11,
                h3k4me3_zscore || -11,
                h3k27ac_zscore || -11,
                ctcf_zscore || -11
            );
            return {
                ct,
                accession,
                dnase_zscore,
                h3k4me3_zscore,
                h3k27ac_zscore,
                ctcf_zscore,
                maxz,
            };
        });
        ctresults[ct] = res;
    }
    return Object.keys(ctresults).reduce(
        (prev, ct) => {
            const indices = ctrequests[ct].indices;
            const results = ctresults[ct];
            results.forEach((result, index) => {
                prev[indices[result.accession]] = result;
            });
            return prev;
        },
        Array.from(Array(requested.length)) as ctspecificdata[]
    );
}

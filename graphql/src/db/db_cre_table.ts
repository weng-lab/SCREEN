import { Client } from 'pg';
import { checkChrom, isaccession, isclose } from '../utils';
import { db } from './db';

const { UserError } = require('graphql-errors');

const accessions = (wheres, params, j: {accessions?: string[]}) => {
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
        'dnase': 'dnase_max',
        'promoter': 'h3k4me3_max',
        'enhancer': 'h3k27ac_max',
        'ctcf': 'ctcf_max'
    };
    for (const name of Object.keys(map)) {
        const exp = map[name];
        if (`rank_${name}_start` in j || `rank_${name}_end` in j) {
            const minDefault = -10.0; // must match slider default
            const maxDefault = 10.0;  // must match slider default
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

const getCtSpecificOrderBy = (exp, ctindex) => ({
    dnase: `cre.${exp}_zscores[${ctindex}] as dnase_zscore`,
    h3k4me3: `cre.${exp}_zscores[${ctindex}] as promoter_zscore`,
    h3k27ac: `cre.${exp}_zscores[${ctindex}] as enhancer_zscore`,
    ctcf: `cre.${exp}_zscores[${ctindex}] as ctcf_zscore`,
}[exp]);
const ctexps = {
    'dnase': 'dnase',
    'promoter': 'h3k4me3',
    'enhancer': 'h3k27ac',
    'ctcf': 'ctcf',
};
const ctSpecificRanks = (wheres, fields, params, ctSpecificObj, ct, j, ctmap) => {
    j = j.ctexps || {};
    ctSpecificObj['ct'] = "'" + ct + "'";
    for (const name of Object.keys(ctexps)) {
        const exp = ctexps[name];
        if (!(ct in ctmap[name])) {
            console.log(ct, 'not in ctmap ', name);
            continue;
        }
        const ctindex = ctmap[name][ct];
        ctSpecificObj[name + '_zscore'] = `cre.${exp}_zscores[${ctindex}]`;
        fields.push(getCtSpecificOrderBy(exp, ctindex));

        if (`rank_${name}_start` in j || `rank_${name}_end` in j) {
            const minDefault = -10.0; // must match slider default
            const maxDefault = 10.0;  // must match slider default
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

export const buildWhereStatement = (ctmap, j: object, chrom: string | undefined, start: string | undefined, stop: string | undefined, pagination: any) => {
    const wheres = [];
    const fields = [
        `json_build_object('chrom', cre.chrom, 'start', cre.start, 'end', cre.stop) as range`,
        'cre.maxZ',
        'cre.gene_all_id',
        'cre.gene_pc_id'
    ];
    const groupBy = [
        'cre.chrom',
        'cre.start',
        'cre.stop',
        'cre.maxZ',
        'cre.gene_all_id',
        'cre.gene_pc_id'
    ];
    const params: any = {};
    const useAccs = accessions(wheres, params, j);
    const ct = j['cellType'];

    const ctspecificobj = {};
    let orderBy;
    notCtSpecificRanks(wheres, params, j);
    if (useAccs || !ct) {
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
        orderBy = pagination.orderBy || 'dnase_zscore';
        ctSpecificRanks(wheres, fields, params, ctspecificobj, ct, j, ctmap);
    }
    for (const name of Object.keys(ctexps)) {
        const exp = ctexps[name];
        ctspecificobj[name + '_zscore'] = `cre.${exp}_zscores`;
    }
    where(wheres, params, chrom, start, stop);

    const ctspecificpairs: Array<string> = [];
    for (const k of Object.keys(ctspecificobj)) {
        ctspecificpairs.push(`'${k}', ${ctspecificobj[k]}`);
        if (k !== 'ct') {
            groupBy.push(ctspecificobj[k]);
        }
    }
    const ctspecificfield = 'json_build_object(' + ctspecificpairs.join(',') + ') as ctspecificraw';

    const infoFields = {
        'accession': 'cre.accession',
        'isproximal': 'cre.isproximal',
        'dnasemax': 'cre.dnase_max',
        'k4me3max': 'cre.h3k4me3_max',
        'k27acmax': 'cre.h3k27ac_max',
        'ctcfmax': 'cre.ctcf_max',
        'concordant': 'cre.concordant'
    };
    for (const k of Object.keys(infoFields)) {
        fields.push(`${infoFields[k]} as ${k}`);
        groupBy.push(infoFields[k]);
    }

    const retfields = [ctspecificfield, ...fields].join(', ');
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

    return db.one(q, params, r => +(r.count));
}

export async function getCreTable(assembly: string, ctmap: object, j, pagination) {
    const chrom = j.range && checkChrom(assembly, j.range.chrom);
    const start = j.range && j.range.start;
    const end = j.range && j.range.end;
    const table = assembly + '_cre_all';
    const { fields, where, params, orderBy } = buildWhereStatement(ctmap, j, chrom, start, end, pagination);
    const offset = pagination.offset || 0;
    const limit = pagination.limit || 1000;
    if (limit > 1000) {
        throw new UserError('Cannot have a limit greater than 1000 in pagination parameters.');
    }
    if (offset + limit > 10000) {
        throw new UserError('Offset + limit cannot be greater than 10000. Refine your search for more data.');
    }
    const query = `
        SELECT ${fields}
        FROM ${table} AS cre
        ${where}
        ORDER BY ${orderBy} DESC
        ${offset !== 0 ? `OFFSET ${offset}` : ''}
        LIMIT ${limit}
    `;

    const res = await db.any(query, params);
    let total = res.length;
    if (limit <= total || offset !== 0) {// reached query limit
        total = await creTableEstimate(table, where, params);
    }
    return {'cres': res, 'total': total};
}

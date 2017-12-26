import { Client } from 'pg';
import { isaccession, isclose } from '../utils';

const accessions = (j: {accessions?: String[]}) => {
    const accs: Array<String> = j['accessions'] || [];
    if (0 == accs.length) {
        return false;
    }

    const accsList: String = accs.filter(isaccession).map(a => a.toUpperCase).join(',');
    const accsQuery = `accession IN (${accsList})`;
    return `(${accsQuery})`;
};

const notCtSpecific = (wheres, fields, j) => {
    // use max zscores
    const allmap = {
        'dnase': 'dnase_max',
        'promoter': 'h3k4me3_max',
        'enhancer': 'h3k27ac_max',
        'ctcf': 'ctcf_max'
    };
    for (const x of ['dnase', 'promoter', 'enhancer', 'ctcf']) {
        if (`rank_${x}_start` in j && `rank_${x}_end` in j) {
            const start = j[`rank_${x}_start`];
            const end = j[`rank_${x}end`];
            const statement = [
                `cre.${allmap[x]} >= ${start}`,
                `cre.${allmap[x]} <= ${end}`].join(' and ');
            wheres.push(`(${statement})`);
        }
        fields.push(`cre.${allmap[x]} AS ${x}_zscore`);
    }
    return { wheres, fields };
};

const ctSpecific = (wheres, fields, ctSpecific, ct, j, ctmap) => {
    ctSpecific['ct'] = "'" + ct + "'";
    const exps = [['dnase', 'dnase'],
    ['promoter', 'h3k4me3'],
    ['enhancer', 'h3k27ac'],
    ['ctcf', 'ctcf']];
    for (const v of exps) {
        const [name, exp] = v;
        if (!(ct in ctmap[name])) {
            fields.push(`'' AS ${name}_zscore`);
            ctSpecific[name + '_zscore'] = 'null';
            continue;
        }
        const ctindex = ctmap[name][ct];
        fields.push(`cre.${exp}_zscores[${ctindex}] AS ${name}_zscore`);
        ctSpecific[name + '_zscore'] = `cre.${exp}_zscores[${ctindex}]`;

        if (`rank_${name}_start` in j && `rank_${name}_end` in j) {
            const start = j[`rank_${name}_start`];
            const end = j[`rank_${name}_end`];
            const minDefault = -10.0; // must match slider default
            const maxDefault = 10.0;  // must match slider default
            let startWhere;
            let endWhere;
            if (!isclose(start, minDefault)) {
                startWhere = `cre.${exp}_zscores[${ctindex}] >= ${start}`;
            }
            if (!isclose(end, maxDefault)) {
                endWhere = `cre.${exp}_zscores[${ctindex}] <= ${end}`;
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

const where = (wheres, chrom, start, stop) => {
    if (chrom && start && stop) {
        wheres.push(`cre.chrom = '${chrom}'`);
        wheres.push(`int4range(cre.start, cre.stop) && int4range(${start}, ${stop})`);
    }
};

const buildWhereStatement = (ctmap, j: Object, chrom: String | null, start: String | null, stop: String | null) => {
    const useAccs = accessions(j);
    const ct = j['cellType'];
    const wheres = [];
    const fields = [
        'maxZ',
        'cre.chrom',
        'cre.start',
        'cre.stop',
        'cre.gene_all_id',
        'cre.gene_pc_id'
    ];
    const ctspecific = {};
    if (useAccs || !ct) {
        notCtSpecific(wheres, fields, j);
    } else {
        ctSpecific(wheres, fields, ctspecific, ct, j, ctmap);
    }
    where(wheres, chrom, start, stop);

    const ctspecificpairs: Array<String> = [];
    for (const k of Object.keys(ctSpecific)) {
        ctspecificpairs.push(`'${k}', ${ctSpecific[k]}`);
    }
    const ctspecificfield = 'json_build_object(' + ctspecificpairs.join(',') + ') as ctSpecifc';

    const infoFields = {
        'accession': 'cre.accession',
        'isproximal': 'cre.isproximal',
        'k4me3max': 'cre.h3k4me3_max',
        'k27acmax': 'cre.h3k27ac_max',
        'ctcfmax': 'cre.ctcf_max',
        'concordant': 'cre.concordant'
    };

    const infopairs: Array<String> = [];
    for (const k of Object.keys(infoFields)) {
        infopairs.push(`'${k}', ${infoFields[k]}`);
    }
    const infofield = 'json_build_object(' + infopairs.join(',') + ') as info';

    const retfields = [infofield, ctspecificfield, ...fields].join(', ');
    let retwhere = '';
    if (0 < wheres.length) {
        retwhere = 'WHERE ' + wheres.join(' and ');
    }
    return { fields: retfields, where: retwhere };
};


async function creTableEstimate(pool, table, where) {
    // estimate count
    // from https://wiki.postgresql.org/wiki/Count_estimate
    const q = `
        SELECT count(0)
        FROM ${table} AS cre
        ${where}
        LIMIT 1
    `;

    const { rows } = await pool.query(q);
    return rows[0]['count'];
}

export async function getCreTable(assembly: String, ctmap: Object, j, chrom, start, stop) {
    const table = assembly + '_cre_all';
    const { fields, where } = buildWhereStatement(ctmap, j, chrom, start, stop);
    const query = `
        SELECT JSON_AGG(r) from(
        SELECT ${fields}
        FROM ${table} AS cre
        ${where}
        ORDER BY maxz DESC
        LIMIT 1000) r
    `;

    const pool = require('./db').pool;
    const res = await pool.query(query);
    const rows = res.rows[0]['json_agg'] || [];
    let total = rows.length;
    if (1000 <= total) {// reached query limit
        total = await creTableEstimate(pool, table, where);
    }
    return {'cres': rows, 'total': total};
}

export async function rfacets_active(ctmap, j) {
    const present: Array<String> = [];
    const ct = j['cellType'];
    if (!ct) {
        return present;
    }
    for (const assay of ['dnase', 'promoter', 'enhancer', 'ctcf']) {
        if (ct in ctmap[assay]) {
            present.push(assay);
        }
    }
}

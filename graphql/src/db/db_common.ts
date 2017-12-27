import { natsort } from '../utils';

const executeQuery = require('./db').executeQuery;

export async function chromCounts(assembly) {
    const tableName = assembly + '_cre_all_nums';
    const q = `SELECT chrom, count from ${tableName}`;
    const res = await executeQuery(q);
    const obj = res.rows.reduce((e, obj) => {
        obj = {...obj, [e[0]]: e[1] };
        return obj;
    }, {});
    return natsort(Object.keys(obj)).map(k => [k, obj[k]]);
}

export async function creHist(assembly) {
    const tableName = assembly + '_cre_bins';
    const q = `SELECT chrom, buckets, numBins, binMax from ${tableName}`;
    const res = await executeQuery(q);
    return res.rows.map(e => ({
        [e[0]]: {
            'bins': e[1],
            'numBins': e[2],
            'binMax': e[3]
        }
    }));
}

export async function geneIDsToApprovedSymbol(assembly) {
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT geneid, approved_symbol
        FROM ${tableName}
        ORDER BY 1
    `;
    const res = await executeQuery(q);
    return res.rows.map(r => ({[r[0]]: r[1]}));
}

export async function rankMethodToIDxToCellType(assembly) {
    const table = assembly + '_rankcelltypeindexex';
    const q = `
            SELECT idx, celltype, rankmethod
            FROM ${table}
        `;

    const res = await executeQuery(q);
    const ret = {};
    const rows = res.rows;
    for (const r of rows) {
        const rank_method = r[2];
        if (!(rank_method in ret)) {
            ret[rank_method] = {};
        }
        ret[rank_method][r[0]] = r[1];
        ret[rank_method][r[1]] = r[0];
    }
    return ret;
}

export async function makeCtMap(assembly) {
    const amap = {
        'DNase': 'dnase',
        'H3K4me3': 'promoter', // FIXME: this could be misleading
        'H3K27ac': 'enhancer', // FIXME: this too
        'CTCF': 'ctcf',
        'Enhancer': 'Enhancer',
        'Promoter': 'Promoter',
        'Insulator': 'Insulator'
    };
    const rmInfo = await rankMethodToIDxToCellType(assembly);
    return Object.keys(rmInfo).filter(k => k in amap).reduce((obj, k) => {
        obj = { ...obj, [amap[k]]: rmInfo[k] };
        return obj;
    }, {});
}

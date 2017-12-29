import { natsort } from '../utils';

const executeQuery = require('./db').executeQuery;

export async function chromCounts(assembly) {
    const tableName = assembly + '_cre_all_nums';
    const q = `SELECT chrom, count from ${tableName}`;
    const res = await executeQuery(q);
    const ret = res.rows.reduce((obj, e) => {
        return {...obj, [e['chrom']]: e['count'] };
    }, {});
    return ret;
}

export async function creHist(assembly) {
    const tableName = assembly + '_cre_bins';
    const q = `SELECT chrom, buckets, numBins, binMax from ${tableName}`;
    const res = await executeQuery(q);
    return res.rows.map(e => ({
        [e['chrom']]: {
            'bins': e['buckets'],
            'numBins': e['numBins'],
            'binMax': e['binMax']
        }
    }));
}

function _intersections_tablename(eset, metadata = false) {
    const possible: any = ['encode', 'cistrome', 'peak'];
    if (!possible.includes(eset)) {
        throw new Error(`intersections_tablename: invalid dataset ${eset}`);
    }
    if ('encode' === eset) {
        eset = 'peak';
    }
    return eset + 'Intersections' + (metadata ? 'Metadata' : '');
}

export async function tfHistoneDnaseList(assembly, eset) {
    const tableName = assembly + '_' + _intersections_tablename(eset, true);
    const q = `
        SELECT distinct label
        FROM ${tableName}
    `;
    const res = await executeQuery(q);
    return res.rows.map(r => r['label']).slice().sort();
}

export async function geBiosampleTypes(assembly) {
    const tableName = 'r_rnas_' + assembly;
    const q = `
        SELECT DISTINCT(biosample_type)
        FROM ${tableName}
        ORDER BY 1
    `;
    const res = await executeQuery(q);
    return res.rows.map(r => r['biosample_type']);
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

export async function getHelpKeys() {
    const q = `
        SELECT key, title, summary
        FROM helpkeys
    `;
    const res = await executeQuery(q);
    return (res.rows as Array<any>).reduce((obj, r) => ({
            ...obj,
            [r['key']]: {
                'title': r['title'],
                'summary': r['summary']
            }
        }), {});
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

async function allDatasets(assembly) {
    // TODO: fixme!!
    const dects = `
    C57BL/6_embryonic_facial_prominence_embryo_11.5_days
    C57BL/6_embryonic_facial_prominence_embryo_12.5_days
    C57BL/6_embryonic_facial_prominence_embryo_13.5_days
    C57BL/6_embryonic_facial_prominence_embryo_14.5_days
    C57BL/6_embryonic_facial_prominence_embryo_15.5_days
    C57BL/6_forebrain_embryo_11.5_days
    C57BL/6_forebrain_embryo_12.5_days
    C57BL/6_forebrain_embryo_13.5_days
    C57BL/6_forebrain_embryo_14.5_days
    C57BL/6_forebrain_embryo_15.5_days
    C57BL/6_forebrain_embryo_16.5_days
    C57BL/6_forebrain_postnatal_0_days
    C57BL/6_heart_embryo_11.5_days
    C57BL/6_heart_embryo_12.5_days
    C57BL/6_heart_embryo_13.5_days
    C57BL/6_heart_embryo_14.5_days
    C57BL/6_heart_embryo_15.5_days
    C57BL/6_heart_embryo_16.5_days
    C57BL/6_heart_postnatal_0_days
    C57BL/6_hindbrain_embryo_11.5_days
    C57BL/6_hindbrain_embryo_12.5_days
    C57BL/6_hindbrain_embryo_13.5_days
    C57BL/6_hindbrain_embryo_14.5_days
    C57BL/6_hindbrain_embryo_15.5_days
    C57BL/6_hindbrain_embryo_16.5_days
    C57BL/6_hindbrain_postnatal_0_days
    C57BL/6_intestine_embryo_14.5_days
    C57BL/6_intestine_embryo_15.5_days
    C57BL/6_intestine_embryo_16.5_days
    C57BL/6_intestine_postnatal_0_days
    C57BL/6_kidney_embryo_14.5_days
    C57BL/6_kidney_embryo_15.5_days
    C57BL/6_kidney_embryo_16.5_days
    C57BL/6_kidney_postnatal_0_days
    C57BL/6_limb_embryo_11.5_days
    C57BL/6_limb_embryo_12.5_days
    C57BL/6_limb_embryo_13.5_days
    C57BL/6_limb_embryo_14.5_days
    C57BL/6_limb_embryo_15.5_days
    C57BL/6_liver_embryo_11.5_days
    C57BL/6_liver_embryo_12.5_days
    C57BL/6_liver_embryo_13.5_days
    C57BL/6_liver_embryo_14.5_days
    C57BL/6_liver_embryo_15.5_days
    C57BL/6_liver_embryo_16.5_days
    C57BL/6_liver_postnatal_0_days
    C57BL/6_lung_embryo_14.5_days
    C57BL/6_lung_embryo_15.5_days
    C57BL/6_lung_embryo_16.5_days
    C57BL/6_lung_postnatal_0_days
    C57BL/6_midbrain_embryo_11.5_days
    C57BL/6_midbrain_embryo_12.5_days
    C57BL/6_midbrain_embryo_13.5_days
    C57BL/6_midbrain_embryo_14.5_days
    C57BL/6_midbrain_embryo_15.5_days
    C57BL/6_midbrain_embryo_16.5_days
    C57BL/6_midbrain_postnatal_0_days
    C57BL/6_neural_tube_embryo_11.5_days
    C57BL/6_neural_tube_embryo_12.5_days
    C57BL/6_neural_tube_embryo_13.5_days
    C57BL/6_neural_tube_embryo_14.5_days
    C57BL/6_neural_tube_embryo_15.5_days
    C57BL/6_stomach_embryo_14.5_days
    C57BL/6_stomach_embryo_15.5_days
    C57BL/6_stomach_embryo_16.5_days
    C57BL/6_stomach_postnatal_0_days`.split('\n');
    const setdects = new Set(dects);

    const makeDataset = (r) => {
        // TODO: clean this
        const ret = {
            ...r,
            'cellTypeName': r['celltypename'],
            'cellTypeDesc': r['celltypedesc'],
            'name': r['celltypename'],
            'value': r['celltypedesc'],  // for datatables
            'isde': r['celltypename'] in dects,
        };
        return Object.keys(ret)
        .filter(key => !(['celltypename', 'celltypedesc'] as any).includes(key))
        .reduce((obj, key) => {
          obj[key] = ret[key];
          return obj;
        }, {});
    };

    const tableName = assembly + '_datasets';
    const cols = ['assay', 'expID', 'fileID', 'tissue',
            'biosample_summary', 'biosample_type', 'cellTypeName',
            'cellTypeDesc', 'synonyms'];
    const q = `
        SELECT ${cols.join(',')} FROM ${tableName}
    `;
    const res = await executeQuery(q);
    return res.rows.map(makeDataset);
}

export async function datasets(assembly) {
    const rows = await allDatasets(assembly);
    const ret: any = {};

    ret.globalCellTypeInfo = {};

    // FIXME: cell types will overwrite...
    for (const r of rows) {
        ret.globalCellTypeInfo[r['name']] = r;
    }

    ret.byFileID = rows.map(r => r['fileID']);
    ret.byCellType = {};
    for (const r of rows) {
        const ctn = r['name'];
        if (!(ctn in ret.byCellType)) {
            ret.byCellType[ctn] = [];
        }
        ret.byCellType[ctn].push(r);
    }

    const testobj = { test: 'test' };
    // used by trees
    ret.biosampleTypeToCellTypes = {};
    for (const ctn of Object.keys(ret.globalCellTypeInfo)) {
        const r = ret.globalCellTypeInfo[ctn];
        const bt = r['biosample_type'];
        if (!(bt in ret.biosampleTypeToCellTypes)) {
            ret.biosampleTypeToCellTypes[bt] = [];
        }
        ret.biosampleTypeToCellTypes[bt].push(ctn);
    }

    // used by CellTypes facet
    ret.globalCellTypeInfoArr = [];
    for (const k of Object.keys(ret.globalCellTypeInfo)) {
        const v = ret.globalCellTypeInfo[k];
        ret.globalCellTypeInfoArr.push(v);
    }

    ret.globalCellTypeInfoArr.sort((a, b) => a['name'].localeCompare(b['name'], 'en', {'sensitivity': 'base'}));

    ret.biosample_types = Array.from(new Set(rows.map(b => b['biosample_type']))).sort();

    return ret;
}

export async function creBigBeds(assembly) {
    const tableName = assembly + '_dcc_cres';
    const q = `
        SELECT celltype, dcc_accession, typ
        FROM ${tableName}
    `;
    const res = await executeQuery(q);
    const ret: any = {};
    for (const {celltype: ct, dcc_accession: acc, typ: typ} of res.rows) {
        if (!(ct in ret)) {
            ret[ct] = {};
        }
        ret[ct][typ] = acc;
    }
    return ret;
}

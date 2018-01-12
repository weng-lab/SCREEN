import { natsort } from '../utils';
import * as CoordUtils from '../coord_utils';
import { db } from './db';

export async function chromCounts(assembly) {
    const tableName = assembly + '_cre_all_nums';
    const q = `SELECT chrom, count from ${tableName}`;
    const res = await db.many(q);
    const ret = res.reduce((obj, e) => {
        return {...obj, [e['chrom']]: e['count'] };
    }, {});
    return ret;
}

export async function creHist(assembly) {
    const tableName = assembly + '_cre_bins';
    const q = `SELECT chrom, buckets, numBins, binMax from ${tableName}`;
    const res = await db.many(q);
    return res.reduce((obj, e) => ({
        ...obj,
        [e['chrom']]: {
            'bins': e['buckets'],
            'numBins': e['numbins'],
            'binMax': e['binmax']
        }
    }), {});
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
    const res = await db.many(q);
    return res.map(r => r['label']).slice().sort();
}

export async function geBiosampleTypes(assembly) {
    const tableName = 'r_rnas_' + assembly;
    const q = `
        SELECT DISTINCT(biosample_type)
        FROM ${tableName}
        ORDER BY 1
    `;
    const res = await db.many(q);
    return res.map(r => r['biosample_type']);
}

export async function geneIDsToApprovedSymbol(assembly) {
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT geneid, approved_symbol
        FROM ${tableName}
        ORDER BY 1
    `;
    const res = await db.many(q);
    return res.map(r => ({[r['geneid']]: r['approved_symbol']}));
}

export async function getHelpKeys() {
    const q = `
        SELECT key, title, summary
        FROM helpkeys
    `;
    const res = await db.many(q);
    return res.reduce((obj, r) => ({
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

    const res = await db.many(q);
    const ret = {};
    for (const r of res) {
        const rank_method = r['rankmethod'];
        if (!(rank_method in ret)) {
            ret[rank_method] = {};
        }
        ret[rank_method][r['idx']] = r['celltype'];
        ret[rank_method][r['celltype']] = r['idx'];
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
    return Object.keys(rmInfo).filter(k => k in amap).reduce((obj, k) => ({
        ...obj,
        [amap[k]]: rmInfo[k]
    }), {});
}

export async function makeCTStable(assembly) {
    const tableName = assembly + '_cre_groups_cts';
    const q = `
        SELECT cellTypeName, pgidx
        FROM ${tableName}
    `;
    const res = await db.many(q);
    return res.reduce((obj, r) => ({ ...obj, [r['celltypename']]: r['pgidx']}));
}

export async function genePos(assembly, gene) {
    let ensemblid = gene;
    if (gene.startsWith('ENS') && gene.indexOf('.') !== -1) {
        ensemblid = gene.split('.')[0];
    }
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT chrom, start, stop, approved_symbol, ensemblid_ver
        FROM ${tableName}
        WHERE chrom != ''
        AND (approved_symbol = $1
        OR ensemblid = $2
        OR ensemblid_ver = $1)
    `;
    const r = await db.oneOrNone(q, [gene, ensemblid]);
    if (!r) {
        console.log('ERROR: missing', gene);
        return { pos: undefined, names: undefined };
    }
    return {
        pos: { chrom: r['chrom'], start: r['start'], end: r['stop'] },
        names: [r['approved_symbol'], r['ensemblid_ver']]
    };
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

    const makeDataset = (r) => {
        // TODO: clean this
        const ret = {
            ...r,
            'cellTypeName': r['celltypename'],
            'cellTypeDesc': r['celltypedesc'],
            'name': r['celltypename'],
            'value': r['celltypedesc'],  // for datatables
            'isde': (dects as any).includes(r['celltypename']),
        };
        return Object.keys(ret)
        .filter(key => !(['celltypename', 'celltypedesc'] as any).includes(key))
        .reduce((obj, key) => {
          obj[key] = ret[key];
          return obj;
        }, {});
    };

    const tableName = assembly + '_datasets';
    const cols = [
        'assay', 'expID', 'fileID', 'tissue',
        'biosample_summary', 'biosample_type', 'cellTypeName',
        'cellTypeDesc', 'synonyms'
    ];
    const q = `
        SELECT ${cols.join(',')} FROM ${tableName}
    `;
    const res = await db.many(q);
    return res.map(makeDataset);
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
    const res = await db.many(q);
    const ret: any = {};
    for (const {celltype: ct, dcc_accession: acc, typ: typ} of res) {
        (ret[ct] = ret[ct] || {})[typ] = acc;
    }
    return ret;
}

export async function genesInRegion(assembly, chrom, start, stop) {
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT approved_symbol,start,stop,strand
        FROM ${tableName}
        WHERE chrom = $1
        AND int4range(start, stop) && int4range($2, $3)
        ORDER BY start
    `;

    const res = await db.many(q, [chrom, start, stop]);
    return res.map(r => ({
        gene: r['approved_symbol'],
        start: r['start'],
        stop: r['stop'],
        strand: r['strand']
    }));
}

export async function nearbyCREs(assembly, coord, halfWindow, cols, isProximalOrDistal) {
    const c = CoordUtils.expanded(coord, halfWindow);
    const tableName = assembly + '_cre_all';
    let q = `
        SELECT ${cols.join(',')}
        FROM ${tableName}
        WHERE chrom = $1
        AND int4range(start, stop) && int4range($2, $3)
    `;

    if (typeof isProximalOrDistal != 'undefined') {
        q += `
        AND isProximal is ${isProximalOrDistal}
        `;
    }
    const res = await db.many(q, [c.chrom, c.start, c.end]);
    return res;
}

export async function genemap(assembly) {
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT ensemblid, ensemblid_ver, approved_symbol, strand
        FROM ${tableName}
        WHERE strand != ''
    `;
    const res = await db.many(q);
    const toSymbol = {};
    const toStrand = {};
    res.forEach(r => {
        toSymbol[r['ensemblid']] = r['approved_symbol'];
        toStrand[r['ensemblid']] = r['strand'];

        toSymbol[r['ensemblid_ver']] = r['approved_symbol'];
        toStrand[r['ensemblid_ver']] = r['strand'];
    });
    return { toSymbol, toStrand };
}

export async function geneInfo(assembly, gene) {
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT *
        FROM ${tableName}
        WHERE approved_symbol = $1
        OR ensemblid = $1
        OR ensemblid_ver = $1
    `;
    const res = await db.many(q, [gene]);
    return res;
}

export async function loadNineStateGenomeBrowser(assembly) {
    const tableName = assembly + '_nine_state';
    const q = `
        SELECT cellTypeName, cellTypeDesc, dnase, h3k4me3, h3k27ac, ctcf, assembly, tissue
        FROM ${tableName}
    `;
    const res = await db.many(q);
    const ret: any = {};

    for (const r of res) {
        for (const k of ['dnase', 'h3k4me3', 'h3k27ac', 'ctcf']) {
            const fileID = r[k];
            let url = '';
            if ('NA' !== fileID) {
                const fn = fileID + '.bigBed.bed.gz';
                url = 'http://bib7.umassmed.edu/~purcarom/screen/ver4/v10/9-State/' + fn;
            }
            r[k + '_url'] = url;
        }
        ret[r['celltypename']] = r;
    }

    return ret;
}

export async function crePos(assembly, accession) {
    const tableName = assembly + '_cre_all';
    const q = `
        SELECT chrom, start, stop
        FROM ${tableName}
        WHERE accession = $1
    `;
    const r = await db.oneOrNone(q, [accession]);
    if (!r) {
        console.log('ERROR: missing', accession);
        return undefined;
    }
    return { chrom: r['chrom'], start: r['start'], end: r['stop']};
}

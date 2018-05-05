import { natsort } from '../utils';
import * as CoordUtils from '../coord_utils';
import { db } from './db';
import { getCreTable } from './db_cre_table';
import { cache } from './db_cache';

export async function chromCounts(assembly) {
    const tableName = assembly + '_cre_all_nums';
    const q = `SELECT chrom, count from ${tableName}`;
    const res = await db.many(q);
    const ret = res.reduce((obj, e) => {
        return {...obj, [e['chrom']]: +(e['count']) };
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
    const tableName =  assembly + '_rnaseq_metadata';
    const q = `
        SELECT DISTINCT(biosample_type)
        FROM ${tableName}
        ORDER BY 1
    `;
    const res = await db.many(q);
    return res.map(r => r['biosample_type']);
}

export async function geBiosamples(assembly) {
    const tableName = assembly + '_rnaseq_metadata';
    const q = `
        SELECT DISTINCT(celltype) as biosample
        FROM ${tableName}
        ORDER BY celltype
    `;
    const res = await db.many(q);
    return res.map(r => r['biosample']);
}

export async function geneIDsToApprovedSymbol(assembly) {
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT geneid, approved_symbol
        FROM ${tableName}
        ORDER BY 1
    `;
    const res = await db.many(q);
    return res.filter(o => o.geneid !== -1).reduce((obj, r) => { obj[r['geneid']] = r['approved_symbol']; return obj; }, {});
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

export async function rankMethodToCellTypes(assembly) {
    const tableName = assembly + '_rankcelltypeindexex';
    const q = `
        SELECT idx, celltype, rankmethod
        FROM ${tableName}
    `;
    const res = await db.any(q);
    const _map = res.reduce((obj, r) => {
        const rankmethod = r['rankmethod'];
        (obj[rankmethod] = obj[rankmethod] || []).push([r['id'], r['celltype']]);
        return obj;
    }, {});
    const ret: any = {};
    for (const k of Object.keys(_map)) {
        const v: Array<any> = _map[k];
        ret[k] = v.sort((a, b) => a[0] - b[0]).map(x => x[1]);
    }
    // ['Enhancer', 'H3K4me3', 'H3K27ac', 'Promoter', 'DNase', 'Insulator', 'CTCF']
    return ret;
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
    return res.reduce((obj, r) => ({ ...obj, [r['celltypename']]: r['pgidx']}), {});
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
        return {
            ...r,
            synonyms: r.synonyms || [],
            'isde': (dects as any).includes(r['value']),
        };
    };

    const tableName = assembly + '_datasets';
    const cols = [
        'assay', 'expid', 'fileid', 'tissue',
        'biosample_summary', 'biosample_type', 'celltypename as value',
        'celltypedesc as name', 'synonyms'
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

    const byCellType = {};
    for (const r of rows) {
        const ctn = r.value;
        if (!(ctn in byCellType)) {
            byCellType[ctn] = {
                name: r.name,
                value: r.value,
                tissue: r.tissue,
                // Sometimes name is null, so fallback to value
                displayName: r.name || r.value,
                isde: r.isde,
                synonyms: r.synonyms,
                assays: [],
            };
        }
        const ct = byCellType[ctn];
        console.assert(ct.name === r.name, 'Cell type name does not match!');
        console.assert(ct.value === r.value, 'Cell type value does not match!', ct.value, r.value);
        if (ct.tissue !== r.tissue) {
            console.log('Cell type tissue does not match!', ct.value, ct.tissue, r.tissue);
        }
        console.assert(ct.isde === r.isde, 'Isde does not match!');
        // We aren't going to check every element, but we can at least check length
        console.assert(ct.synonyms.length === r.synonyms.length, 'Synonyms length does not match!');
        byCellType[ctn].assays.push({
            assay: r.assay,
            expid: r.expid,
            fileid: r.fileid,
            tissue: r.tissue,
            biosample_summary: r.biosample_summary,
            biosample_type: r.biosample_type,
        });
    }
    ret.byCellTypeValue = byCellType;

    ret.byFileID = rows.map(r => r['fileid']);

    // used by trees
    ret.biosampleTypeToCellTypes = {};
    for (const r of (Object as any).values(byCellType)) {
        // Is biosample_type guaranteed to be consistent for the same name, if so change schema
        const bt = r.assays[0]['biosample_type'];
        if (!(bt in ret.biosampleTypeToCellTypes)) {
            ret.biosampleTypeToCellTypes[bt] = [];
        }
        ret.biosampleTypeToCellTypes[bt].push(r.name);
    }

    // used by CellTypes facet
    ret.globalCellTypeInfoArr = (Object as any).values(byCellType).slice();
    ret.globalCellTypeInfoArr.sort((a, b) => a['value'].localeCompare(b['value'], 'en', {'sensitivity': 'base'}));

    ret.biosample_types = Array.from(new Set(rows.map(b => b['biosample_type']))).sort();

    return ret;
}

async function beds(assembly, tableName) {
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

export async function creBigBeds(assembly) {
    const tableName = assembly + '_dcc_cres';
    return beds(assembly, tableName);
}

export async function creBeds(assembly) {
    const tableName = assembly + '_dcc_cres_beds';
    return beds(assembly, tableName);
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
    const expanded = CoordUtils.expanded(coord, halfWindow);
    const c = await cache(assembly);
    const cres = await getCreTable(assembly, c, { range: expanded }, {});
    return cres.cres;
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
    const res = await db.any(q, [gene]);
    return res;
}

export async function loadNineStateGenomeBrowser(assembly) {
    const tableName = assembly + '_nine_state';
    const q = `
        SELECT cellTypeName, cellTypeDesc, dnase, h3k4me3, h3k27ac, ctcf, assembly, tissue
        FROM ${tableName}
    `;
    const res = await db.any(q);
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

async function getColsForAccession(assembly, accession, cols) {
    const tableName = assembly + '_cre_all';
    const q = `
        SELECT ${cols.join(',')}
        FROM ${tableName}
        WHERE accession = $1
    `;
    return db.oneOrNone(q, [accession]);
}

export async function creRanksPromoter(assembly, accession) {
    const cols = ['promoter_zscores'];
    const r = await getColsForAccession(assembly, accession, cols);
    return {'zscores': {'Promoter': r['promoter_zscores']}};
}

export async function creRanksEnhancer(assembly, accession) {
    const cols = ['enhancer_zscores'];
    const r = await getColsForAccession(assembly, accession, cols);
    return {'zscores': {'Enhancer': r['enhancer_zscores']}};
}

export async function creRanks(assembly, accession) {
    const cols = `
dnase_zscores
ctcf_zscores
enhancer_zscores
h3k27ac_zscores
h3k4me3_zscores
insulator_zscores
promoter_zscores`.trim().split('\n');

    const r = await getColsForAccession(assembly, accession, cols);
    return cols.reduce((obj, k) => ({ ...obj, [k.split('_')[0]]: r[k]}), {});
}

async function getGenes(assembly, accession, allOrPc) {
    const tableall = assembly + '_cre_all';
    const tableinfo = assembly + '_gene_info';
    const q = `
        SELECT gi.approved_symbol, g.distance, gi.ensemblid_ver, gi.chrom, gi.start, gi.stop
        FROM
        (SELECT UNNEST(gene_${allOrPc}_id) geneid,
        UNNEST(gene_${allOrPc}_distance) distance
        FROM ${tableall} WHERE accession = $1) AS g
        INNER JOIN ${tableinfo} AS gi
        ON g.geneid = gi.geneid
    `;
    return db.any(q, [accession]);
}

export async function creGenes(assembly, accession, chrom) {
    return {
        genesAll: await getGenes(assembly, accession, 'all'),
        genesPC: await getGenes(assembly, accession, 'pc')
    };
}

export async function getTadOfCRE(assembly, accession) {
    const tablecre = assembly + '_cre_all';
    const tableinfo = assembly + '_tads_info';
    const tabletads = assembly + '_tads';
    const gettadboundaries = `
        SELECT tads.geneids, ti.start, ti.stop
        FROM ${tableinfo} ti
        inner join ${tabletads} tads
        on ti.tadname = tads.tadname
        WHERE accession = $1
    `;
    return db.one(gettadboundaries, [accession]);
}

export async function cresInTad(assembly, accession, chrom, start, end, tadInfo) {
    const c = await cache(assembly);
    const cres = await getCreTable(assembly, c, { range: { chrom, start: tadInfo.start, end: tadInfo.stop } }, {});
    return cres.cres
        .map(cre => ({
            distance: Math.min(Math.abs(end - cre.range.end), Math.abs(start - cre.range.start)),
            ccRE: cre,
        }))
        .filter(cre => cre.distance < 100000)
        .filter(cre => cre.ccRE.accession  !== accession)
        .sort((a, b) => a.distance - b.distance);
}


export async function genesInTad(assembly, accession, allOrPc, { geneids }) {
    const tableName = assembly + '_tads';
    const tableinfo = assembly + '_gene_info';
    const q = `
        SELECT gi.approved_symbol, gi.ensemblid_ver, gi.chrom, gi.start, gi.stop
        FROM ${tableinfo} gi
        WHERE gi.geneid = ANY($1)
    `;
    return db.any(q, [geneids]);
}

export async function distToNearbyCREs(assembly, accession, coord, halfWindow) {
    const expanded = CoordUtils.expanded(coord, halfWindow);
    const c = await cache(assembly);
    const cres = await getCreTable(assembly, c, { range: { chrom: expanded.chrom, start: expanded.start, end: expanded.end } }, {});
    return cres.cres
        .filter(cre => cre.accession !== accession)
        .map(cre => ({
            ccRE: cre,
            distance: Math.min(Math.abs(coord.end - cre.range.end), Math.abs(coord.start - cre.range.start))
        }))
        .sort((a, b) => a.distance - b.distance);
}

export async function intersectingSnps(assembly, accession, coord, halfWindow) {
    const c = CoordUtils.expanded(coord, halfWindow);
    const tableName = assembly + '_snps';
    const q = `
        SELECT start, stop, snp
        FROM ${tableName}
        WHERE chrom = $1
        AND int4range(start, stop) && int4range($2, $3)
    `;
    const snps = await db.any(q, [c.chrom, c.start, c.end]);
    return snps
        .map(snp => ({
            distance: Math.min(Math.abs(coord.end - snp.stop), Math.abs(coord.start - snp.start)),
            snp: {
                id: snp.snp,
                range: {
                    chrom: coord.chrom,
                    start: snp.start,
                    end: snp.stop,
                },
            },
        }))
        .sort((a, b) => a.distance - b.distance);
}

export async function peakIntersectCount(assembly, accession, totals, eset) {
const tableName = assembly + '_' + _intersections_tablename(eset);
    const q = `
        SELECT tf, histone
        FROM ${tableName}
        WHERE accession = $1
    `;
    const res = await db.oneOrNone(q, [accession]);
    if (!res) {
        return {'tfs': [], 'histone': []};
    }
    const tfs = Object
        .keys(res['tf'])
        .map(k => ({'name': k, 'n': Array.from(new Set(res['tf'][k])).length, 'total': totals[k] || -1}));
    const histones = Object
        .keys(res['histone'])
        .map(k => ({'name': k, 'n': Array.from(new Set(res['histone'][k])).length, 'total': totals[k] || -1}));
    return { 'tf': tfs, 'histone': histones };
}

export async function rampageByGene(assembly, ensemblid_ver) {
    const tableName = assembly + '_rampage';
    const q = `
        SELECT *
        FROM ${tableName}
        WHERE ensemblid_ver = $1
    `;
    const rows = await db.any(q, [ensemblid_ver]);

    const ret: Array<any> = [];
    for (const dr of rows) {
        const nr = {'data': {}};
        for (const k of Object.keys(dr)) {
            const v = dr[k];
            if (k.startsWith('encff')) {
                nr['data'][k] = v;
                continue;
            }
            nr[k] = v;
        }
        if (!nr['data']) {
            continue;
        }
        ret.push(nr);
    }
    return ret;
}

export async function rampage_info(assembly) {
    const tableName = assembly + '_rampage_info';
    const q = `
        SELECT *
        FROM ${tableName}
    `;
    const rows = await db.any(q);
    const ret: any = {};
    for (const r of rows) {
        ret[r['fileid']] = r;
    }
    return ret;
}

export async function rampageEnsemblID(assembly, gene) {
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT ensemblid_ver FROM ${tableName}
        WHERE approved_symbol = $1
    `;
    return await db.oneOrNone(q, [gene], r => r && r.ensemblid_ver);
}

export async function linkedGenes(assembly, accession) {
    const tableName = assembly + '_linked_genes';
    const q = `
        SELECT gene, celltype, method, dccaccession
        FROM ${tableName}
        WHERE cre = $1
    `;
    return db.any(q, [accession]);
}

export async function histoneTargetExps(assembly, accession, target, eset) {
    const peakTn = assembly + '_' + _intersections_tablename(eset);
    const peakMetadataTn = assembly + '_' + _intersections_tablename(eset, true);
    const q = `
        SELECT ${eset === 'cistrome' ? '' : 'expID, '}fileID, biosample_term_name${eset === 'cistrome' ? ', tissue' : ''}
        FROM ${peakMetadataTn}
        WHERE fileID IN (
        SELECT distinct(jsonb_array_elements_text(histone->$1))
        FROM ${peakTn}
        WHERE accession = $2
        )
        ORDER BY biosample_term_name
    `;
    const rows = await db.any(q, [target, accession]);
    return rows.map(r => ({
        'expID': eset === 'cistrome' ? r['fileid'] : (r['expid'] + ' / ' + r['fileid']),
        'biosample_term_name': r['biosample_term_name']
    }));
}

export async function tfTargetExps(assembly, accession, target, eset) {
    const peakTn = assembly + '_' + _intersections_tablename(eset, false);
    const peakMetadataTn = assembly + '_' + _intersections_tablename(eset, true);
    const q = `
        SELECT ${eset === 'cistrome' ? '' : 'expID, '}fileID, biosample_term_name
        FROM ${peakMetadataTn}
        WHERE fileID IN (
        SELECT distinct(jsonb_array_elements_text(tf->$1))
        FROM ${peakTn}
        WHERE accession = $2
        )
        ORDER BY biosample_term_name
    `;
    const rows = await db.any(q, [target, accession]);
    return rows.map(r => ({
        'expID': eset === 'cistrome' ? r['fileid'] : (r['expid'] + ' / ' + r['fileid']),
        'biosample_term_name': r['biosample_term_name']
    }));
}

export async function tfHistCounts(assembly, eset) {
    const tableName = assembly + '_' + eset + 'intersectionsmetadata';
    const q = `
        SELECT COUNT(label), label
        FROM ${tableName}
        GROUP BY label
    `;
    const rows = await db.any(q);
    return rows.reduce((obj, r) => ({ ...obj, [r['label']]: +(r['count'])}), {});
}

export async function inputData(assembly) {
    const tableName = assembly + '_peakintersectionsmetadata';
    const q = `
        SELECT $1 as assembly, biosample_term_name, array_agg(fileid) AS fileids
        FROM ${tableName}
        GROUP BY biosample_term_name
        ORDER BY biosample_term_name
    `;
    return await db.any(q, [assembly]);
}

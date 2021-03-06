import * as CoordUtils from '../coord_utils';
import { db } from './db';
import { getCreTable } from './db_cre_table';
import { loadCache, Biosample } from './db_cache';
import { Assembly, assaytype, NearbyRE, ChromRange } from '../types';
import { nearbyGene } from '../resolvers/credetails';
import { createDataLoader } from '../utils';
import { Gene } from '../types';

export async function chromCounts(assembly) {
    const tableName = assembly + '_cre_all_nums';
    const q = `SELECT chrom, count from ${tableName}`;
    const res = await db.any(q);
    const ret = res.reduce((obj, e) => {
        return { ...obj, [e['chrom']]: +e['count'] };
    }, {});
    return ret;
}

export async function creHist(assembly) {
    const tableName = assembly + '_cre_bins';
    const q = `SELECT chrom, buckets, numBins, binMax from ${tableName}`;
    const res = await db.any(q);
    return res.reduce(
        (obj, e) => ({
            ...obj,
            [e['chrom']]: {
                bins: e['buckets'],
                numBins: e['numbins'],
                binMax: e['binmax'],
            },
        }),
        {}
    );
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
    const res = await db.any(q);
    return res
        .map(r => r['label'])
        .slice()
        .sort();
}

export async function geBiosampleTypes(assembly) {
    const tableName = assembly + '_rnaseq_metadata';
    const q = `
        SELECT DISTINCT(biosample_type)
        FROM ${tableName}
        ORDER BY 1
    `;
    const res = await db.any(q);
    return res.map(r => r['biosample_type']);
}

export async function geBiosamples(assembly) {
    const tableName = assembly + '_rnaseq_metadata';
    const q = `
        SELECT DISTINCT(celltype) as biosample
        FROM ${tableName}
        ORDER BY celltype
    `;
    const res = await db.any(q);
    return res.map(r => r['biosample']);
}

export async function geneIDsToApprovedSymbol(assembly) {
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT geneid, approved_symbol
        FROM ${tableName}
        ORDER BY 1
    `;
    const res = await db.any(q);
    return res
        .filter(o => o.geneid !== -1)
        .reduce((obj, r) => {
            obj[r['geneid']] = r['approved_symbol'];
            return obj;
        }, {});
}

export async function getHelpKeys() {
    const q = `
        SELECT key, title, summary
        FROM helpkeys
    `;
    const res = await db.any(q);
    return res.reduce(
        (obj, r) => ({
            ...obj,
            [r['key']]: {
                title: r['title'],
                summary: r['summary'],
            },
        }),
        {}
    );
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

export type RankMethod = 'CTCF' | 'DNase' | 'Enhancer' | 'H3K4me3' | 'H3K27ac' | 'Insulator' | 'Promoter';
export type celltype = string;
export type ctindex = number;
export async function rankMethodToIDxToCellType(assembly): Promise<Record<RankMethod, Record<celltype, ctindex>>> {
    const table = assembly + '_rankcelltypeindexex';
    const q = `
            SELECT idx, celltype, rankmethod
            FROM ${table}
        `;

    const res: Array<{ idx: number; celltype: string; rankmethod: RankMethod }> = await db.any(q);
    const ret = {} as Record<RankMethod, Record<celltype, ctindex>>;
    for (const r of res) {
        const rank_method = r.rankmethod;
        ret[rank_method] = ret[rank_method] || {};
        ret[rank_method][r.celltype] = r.idx;
    }
    return ret;
}

export async function makeCtMap(assembly): Promise<Record<assaytype, Record<celltype, ctindex>>> {
    const amap: Partial<Record<RankMethod, assaytype>> = {
        DNase: 'dnase',
        H3K4me3: 'h3k4me3',
        H3K27ac: 'h3k27ac',
        CTCF: 'ctcf',
    };
    const rmInfo = await rankMethodToIDxToCellType(assembly);
    const ret = Object.keys(rmInfo)
        .filter(k => k in amap)
        .reduce((obj, k) => {
            obj[amap[k]] = rmInfo[k];
            return obj;
        }, {} as Record<assaytype, Record<celltype, ctindex>>);
    return ret;
}

export async function makeCTStable(assembly) {
    const tableName = assembly + '_cre_groups_cts';
    const q = `
        SELECT cellTypeName, pgidx
        FROM ${tableName}
    `;
    const res = await db.any(q);
    return res.reduce((obj, r) => ({ ...obj, [r['celltypename']]: r['pgidx'] }), {});
}
// TODO: add de
// Need to resolve cistrome metadata problems
// Example: GSM1003744; Labeled as K562, but mouse
/*
export const biosamplesQuery = (assembly: Assembly, where?: string, fields?: string[], orderby?: string, limit?: number): string => {
    const q = `
        SELECT DISTINCT biosample_term_name, value, count(*), array_agg(t) as type, array_agg(id) as id, jsonb_agg(synonyms) as synonyms${fields ? ', ' + fields.join(', ') : ''}
        FROM (
            SELECT biosample_term_name, biosample_term_name as value, 'peak' as t, fileid as id, null::jsonb as synonyms
            FROM ${assembly}_peakintersectionsmetadata
            UNION ALL
            SELECT biosample_term_name, biosample_term_name as value, 'cistrome' as t, fileid as id, null::jsonb as synonyms
            FROM ${assembly}_cistromeintersectionsmetadata
            UNION ALL
            SELECT celltypedesc as biosample_term_name, celltypename as value, 'ninestate' as t, fileid as id, synonyms as synonyms
            FROM ${assembly}_datasets
            UNION ALL
            SELECT biosample_term_name, biosample_term_name as value, 'rnaseq' as t, fileid as id, null::jsonb as synonyms
            FROM ${assembly}_rnaseq_metadata
        ) cts
        ${where || ''}
        GROUP BY biosample_term_name
        ${orderby || ''}
        ${limit ? 'LIMIT ' + limit : ''}
    `;
    return q;
};
*/
export const biosamplesQuery = (
    assembly: Assembly,
    where?: string,
    fields?: string[],
    orderby?: string,
    limit?: number
): string => {
    const q = `
        SELECT DISTINCT biosample_term_name, array_agg(value) as values, count(*), array_agg(t) as type, array_agg(id) as id, jsonb_agg(synonyms) as synonyms${
            fields ? ', ' + fields.join(', ') : ''
        }
        FROM (
            SELECT biosample_term_name, biosample_term_name as value, 'peak' as t, fileid as id, null::jsonb as synonyms
            FROM ${assembly}_peakintersectionsmetadata
            UNION ALL
            SELECT celltypedesc as biosample_term_name, celltypename as value, 'ninestate' as t, fileid as id, synonyms as synonyms
            FROM ${assembly}_datasets
            UNION ALL
            SELECT biosample_term_name, biosample_term_name as value, 'rnaseq' as t, fileid as id, null::jsonb as synonyms
            FROM ${assembly}_rnaseq_metadata
        ) cts
        ${where || ''}
        GROUP BY biosample_term_name
        ${orderby || ''}
        ${limit ? 'LIMIT ' + limit : ''}
    `;
    return q;
};

export async function makeBiosamplesMap(assembly): Promise<Record<string, Biosample>> {
    const q = biosamplesQuery(assembly);
    const res = await db.any<{
        biosample_term_name: string;
        values: string[];
        count: number;
        type: string[];
        id: string[];
        synonyms: string[][];
    }>(q);
    const ret = res.reduce((prev, curr) => {
        prev[curr.biosample_term_name] = {
            name: curr.biosample_term_name,
            celltypevalue: curr.values.filter(v => !!v)[0] || curr.biosample_term_name,
            count: curr.count,
            is_ninestate: curr.type.includes('ninestate'),
            is_intersection_peak: curr.type.includes('peak'),
            is_intersection_cistrome: curr.type.includes('cistrome'),
            is_rnaseq: curr.type.includes('rnaseq'),
        };
        return prev;
    }, {} as Record<string, Biosample>);
    return ret;
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
        names: [r['approved_symbol'], r['ensemblid_ver']],
    };
}

async function allDatasets(assembly, dectmap) {
    const todect = s =>
        s
            .replace('C57BL/6_', '')
            .replace('embryo_', '')
            .replace('_days', '')
            .replace('postnatal_', '');

    const makeDataset = r => {
        return {
            ...r,
            synonyms: r.synonyms || [],
            isde: !!dectmap[todect(r.value)],
        };
    };

    const tableName = assembly + '_datasets';
    const cols = [
        'assay',
        'expid',
        'fileid',
        'tissue',
        'biosample_summary',
        'biosample_type',
        'celltypename as value',
        'celltypedesc as name',
        'synonyms',
    ];
    const q = `
        SELECT ${cols.join(',')} FROM ${tableName}
    `;
    const res = await db.any(q);
    return res.map(makeDataset);
}

export async function datasets(assembly) {
    const de_ctidmap = assembly === 'mm10' ? await loadCache(assembly).de_ctidmap() : {};
    const rows = await allDatasets(assembly, de_ctidmap);
    const ret: any = {};

    const byCellType = {};
    for (const r of rows) {
        const ctn = r.value;
        if (!(ctn in byCellType)) {
            byCellType[ctn] = {
                name: r.name,
                value: r.value,
                tissue: r.tissue,
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
    ret.globalCellTypeInfoArr.sort((a, b) => a['value'].localeCompare(b['value'], 'en', { sensitivity: 'base' }));

    ret.biosample_types = Array.from(new Set(rows.map(b => b['biosample_type']))).sort();

    return ret;
}

async function beds(assembly, tableName): Promise<Record<string, Record<string, string>>> {
    const q = `
        SELECT celltype, dcc_accession, typ
        FROM ${tableName}
    `;
    const res = await db.any(q);
    const ret: Record<string, Record<string, string>> = {};
    for (const { celltype: ct, dcc_accession: acc, typ: typ } of res) {
        (ret[ct] = ret[ct] || {})[typ] = acc;
    }
    return ret;
}

export async function ccreBigBeds(assembly) {
    const tableName = assembly + '_dcc_cres';
    return beds(assembly, tableName);
}

export async function ccreBeds(assembly) {
    const tableName = assembly + '_dcc_cres_beds';
    return beds(assembly, tableName);
}

export async function genemap(assembly): Promise<Record<string, Gene & { ensemblid: string }>> {
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT ensemblid, ensemblid_ver, approved_symbol, chrom, start, stop, strand
        FROM ${tableName}
    `;
    const res = await db.any(q);
    return res.reduce((prev, curr) => {
        const gene = {
            assembly,
            approved_symbol: curr.approved_symbol,
            ensemblid: curr.ensemblid,
            ensemblid_ver: curr.ensemblid_ver,
            coords: {
                chrom: curr.chrom,
                start: curr.start,
                end: curr.stop,
                strand: curr.strand,
            },
        };
        prev[gene.ensemblid] = gene;
        prev[gene.ensemblid_ver] = gene;
        return prev;
    }, {});
}

export async function geneInfo(assembly: Assembly, gene: string) {
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
    return { chrom: r['chrom'], start: r['start'], end: r['stop'] };
}

const ccreEpigeneticSignals = async (
    assembly: Assembly,
    accessions: readonly string[]
): Promise<Record<assaytype, number[]>[]> => {
    const tableName = assembly + '_cre_all';
    const q = `
SELECT dnase_zscores, ctcf_zscores, h3k27ac_zscores, h3k4me3_zscores
FROM ${tableName}
JOIN unnest($1) WITH ORDINALITY t(accession, ord) USING (accession)
ORDER BY t.ord
    `;
    const res = await db.any(q, [accessions]);
    return res.map(r => ({
        dnase: r.dnase_zscores,
        ctcf: r.ctcf_zscores,
        h3k27ac: r.h3k27ac_zscores,
        h3k4me3: r.h3k4me3_zscores,
    }));
};
export const ccreEpigeneticSignalsLoader = createDataLoader(ccreEpigeneticSignals);

export const genes = async (assembly: Assembly, genes: readonly string[]): Promise<Gene[]> => {
    const tableName = assembly + '_gene_info';
    const q = `
SELECT ensemblid_ver, approved_symbol, chrom, start, stop, strand
FROM ${tableName}
JOIN unnest($1) WITH ORDINALITY t(approved_symbol, ord) USING (approved_symbol)
ORDER BY t.ord
    `;
    const res = await db.any(q, [genes]);
    if (res.length !== genes.length) {
        throw new Error('Invalid gene');
    }
    return res.map(r => ({
        assembly,
        approved_symbol: r.approved_symbol,
        ensemblid_ver: r.ensemblid_ver,
        coords: {
            assembly,
            chrom: r.chrom,
            start: r.start,
            end: r.stop,
            strand: r.strand,
        },
    }));
};
export const genesLoader = createDataLoader(genes);

// cCREs
export async function getGenesMany(
    assembly: Assembly,
    accessions: readonly string[],
    allOrPc
): Promise<nearbyGene[][]> {
    const tableall = assembly + '_cre_all';
    const tableinfo = assembly + '_gene_info';
    const tableTss = assembly + '_tss_info';
    const q = `
SELECT g.accession, gi.approved_symbol, g.distance, gi.ensemblid_ver, gi.chrom, gi.start, gi.stop, gi.strand, tss.chrom as tss_chrom, tss.start as tss_start, tss.stop as tss_stop
FROM (
    SELECT UNNEST(gene_${allOrPc}_id) geneid, UNNEST(gene_${allOrPc}_distance) distance, accession
    FROM ${tableall}
    WHERE accession = ANY($1)
) AS g
INNER JOIN ${tableinfo} AS gi
ON g.geneid = gi.geneid
INNER JOIN ${tableTss} as tss
ON gi.ensemblid_ver = tss.ensemblid_ver
    `;
    const res = await db.any(q, [accessions]);
    const map: Record<string, nearbyGene[]> = res.reduce((prev: Record<string, nearbyGene[]>, row) => {
        prev[row.accession] = prev[row.accession] || [];

        prev[row.accession].push({
            gene: {
                assembly,
                approved_symbol: row.approved_symbol,
                ensemblid_ver: row.ensemblid_ver,
                coords: {
                    assembly,
                    chrom: row.chrom,
                    start: row.start,
                    end: row.stop,
                    strand: row.strand,
                },
            },
            distance: row.distance,
        });
        return prev;
    }, {} as Record<string, nearbyGene[]>);
    console.log(map);
    return accessions.map(accession => map[accession] || new Error(`BUG: nearby genes missing for ${accession}`));
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
    return db.oneOrNone(gettadboundaries, [accession]);
}

export async function cresInTad(assembly, accession, chrom, start, end, tadInfo): Promise<NearbyRE[]> {
    const ctmap = loadCache(assembly).ctmap();
    const cres = await getCreTable(assembly, ctmap, { range: { chrom, start: tadInfo.start, end: tadInfo.stop } }, {});
    return cres.ccres
        .map(cre => ({
            distance: Math.min(Math.abs(end - cre.end), Math.abs(start - cre.start)),
            cCRE: cre,
        }))
        .filter(cre => cre.distance < 100000)
        .filter(cre => cre.cCRE.accession !== accession)
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

export async function distToNearbyCREs(assembly, accession, coord, halfWindow): Promise<NearbyRE[]> {
    const expanded = CoordUtils.expanded(coord, halfWindow);
    const ctmap = await loadCache(assembly).ctmap();
    const cres = await getCreTable(
        assembly,
        ctmap,
        { range: { chrom: expanded.chrom, start: expanded.start, end: expanded.end } },
        {}
    );
    return cres.ccres
        .filter(cre => cre.accession !== accession)
        .map(cre => ({
            cCRE: cre,
            distance: Math.min(Math.abs(coord.end - cre.end), Math.abs(coord.start - cre.start)),
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
                assembly,
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

export async function peakIntersectCount(assembly, accession, totals, eset): Promise<{ tf: any[]; histone: any[] }> {
    const tableName = assembly + '_' + _intersections_tablename(eset);
    const q = `
        SELECT tf, histone
        FROM ${tableName}
        WHERE accession = $1
    `;
    const res = await db.oneOrNone(q, [accession]);
    if (!res) {
        return { tf: [], histone: [] };
    }
    const tf = Object.keys(res['tf']).map(k => ({
        name: k,
        n: Array.from(new Set(res['tf'][k])).length,
        total: totals[k] || -1,
    }));
    const histone = Object.keys(res['histone']).map(k => ({
        name: k,
        n: Array.from(new Set(res['histone'][k])).length,
        total: totals[k] || -1,
    }));
    return { tf, histone };
}

export async function rampageByGene(assembly, ensemblid_ver) {
    const tableName = assembly + '_rampage';
    const q = `
        SELECT *
        FROM ${tableName}
        WHERE ensemblid_ver = $1
    `;
    const rows = await db.any(q, [ensemblid_ver]);

    return rows.map(dr =>
        Object.keys(dr).reduce(
            (nr, k) => {
                const v = dr[k];
                if (k.startsWith('encff')) {
                    nr.data[k] = v;
                } else if (k === 'chrom' || k === 'start' || k === 'strand') {
                    nr.coords[k] = v;
                } else if (k === 'stop') {
                    nr.coords['end'] = v;
                } else {
                    nr[k] = v;
                }
                return nr;
            },
            { data: {}, coords: {} }
        )
    );
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

export async function linkedGenes(assembly, accession) {
    const tableName = assembly + '_linked_genes';
    const q = `
        SELECT gene, celltype, method, dccaccession
        FROM ${tableName}
        WHERE cre = $1
    `;
    return db.any(q, [accession]);
}

export async function targetExps(assembly, accession, target, eset: 'peak' | 'cistrome', type: 'tf' | 'histone') {
    const peakTn = assembly + '_' + _intersections_tablename(eset);
    const peakMetadataTn = assembly + '_' + _intersections_tablename(eset, true);
    const q = `
        SELECT ${eset === 'cistrome' ? '' : 'expID, '}fileID, biosample_term_name${
        eset === 'cistrome' ? ', tissue' : ''
    }
        FROM ${peakMetadataTn}
        WHERE fileID IN (
        SELECT distinct(jsonb_array_elements_text(${type}->$1))
        FROM ${peakTn}
        WHERE accession = $2
        )
        ORDER BY biosample_term_name
    `;
    const rows = await db.any(q, [target, accession]);
    return rows.map(r => ({
        expID: eset === 'cistrome' ? r['fileid'] : r['expid'] + ' / ' + r['fileid'],
        biosample_term_name: r['biosample_term_name'],
    }));
}

export async function histoneTargetExps(assembly, accession, target, eset: 'peak' | 'cistrome') {
    return targetExps(assembly, accession, target, eset, 'histone');
}

export async function tfTargetExps(assembly, accession, target, eset) {
    return targetExps(assembly, accession, target, eset, 'tf');
}

export async function tfHistCounts(assembly, eset: 'peak' | 'cistrome') {
    const tableName = assembly + '_' + eset + 'intersectionsmetadata';
    const q = `
SELECT COUNT(label), label
FROM ${tableName}
GROUP BY label
    `;
    const rows = await db.any(q);
    return rows.reduce((obj, r) => ({ ...obj, [r['label']]: +r['count'] }), {});
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

// Almost like biosampleSpecificSignals except filter by a threshold
// TODO: add a threshold param to biosampleSpecificSignals
export async function activeCts(
    assembly: Assembly,
    accession: string,
    assays: assaytype[],
    threshold: number = 1.64
): Promise<string[]> {
    const ranks = await ccreEpigeneticSignalsLoader[assembly].load(accession);
    const ctmap = await loadCache(assembly).ctmap();
    const active = new Set<string>();
    for (const assay of assays) {
        const cts = ctmap[assay];
        const ctranks = ranks[assay];
        Object.keys(cts).forEach(ct => {
            const index = cts[ct];
            const value = ctranks[index];
            if (value >= threshold) {
                active.add(ct);
            }
        });
    }
    return Array.from(active);
}

export async function transcriptsForGene(gene: Gene): Promise<{ transcript: string; gene: Gene; range: ChromRange }[]> {
    const tableName = gene.assembly + '_gene_details';
    const q = `
SELECT transcript_id as transcript, seqname as chrom, startpos as start, endpos as end, strand
FROM ${tableName}
WHERE gene_id = $1
AND feature = 'transcript'
    `;
    const res = await db.any<{ transcript: string; chrom: string; start: number; end: number; strand: string }>(q, [
        gene.ensemblid_ver,
    ]);
    return res.map(row => ({
        gene,
        transcript: row.transcript,
        range: {
            assembly: gene.assembly,
            chrom: row.chrom,
            start: row.start,
            end: row.end,
            strand: row.strand,
        },
    }));
}

export const transcriptExons = async (assembly: Assembly, transcript_ver: string): Promise<ChromRange[]> => {
    const tableName = assembly + '_gene_details';
    const q = `
SELECT transcript_id, feature, seqname as chrom, startpos as start, endpos as end, strand
FROM ${tableName}
WHERE feature = 'exon'
AND transcript_id = $1
    `;
    const res = await db.any<{ chrom: string; start: number; end: number; strand: string }>(q, [transcript_ver]);
    return res.map(row => ({ ...row, assembly, chrom: row.chrom.trim(), strand: row.strand.trim() }));
};

export const geneExons = async (assembly: Assembly, ensemblid_ver: string) => {
    const tableName = assembly + '_gene_details';
    const q = `
SELECT seqname as chrom, startpos as start, endpos as end, strand
FROM ${tableName}
WHERE feature = 'exon'
AND transcript_id = (
    SELECT transcript_id
    FROM grch38_gene_details
    WHERE gene_id = $1
    AND feature = 'exon'
    LIMIT 1
)
    `;
    const res = await db.map<{ chrom: string; start: number; end: number; strand: string }>(
        q,
        [ensemblid_ver],
        row => ({ ...row, chrom: row.chrom.trim(), strand: row.strand.trim() })
    );
    return res;
};

export async function geCellCompartments(assembly) {
    const tableName = assembly + '_rnaseq_metadata';
    const q = `
        SELECT DISTINCT(cellcompartment)
        FROM ${tableName}
        ORDER BY 1
    `;
    const res = await db.many(q);
    return res.map(r => r['cellcompartment']);
}

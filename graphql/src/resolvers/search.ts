import { checkChrom, isaccession, checkCreAssembly } from '../utils';
import { GraphQLFieldResolver } from 'graphql';
import * as Parse from '../db/db_parse';
import { GeneParse } from '../db/db_parse';

const re_range = /^[0-9,\.]+[\s\-]+[0-9,\.]+/;
const re_base = /^[0-9,\.]+/;
const re_chrom = /^[cC][hH][rR][0-9XxYy][0-9]?/;

const chrom_lengths = require('../constants').chrom_lengths;
function find_coord(assembly, s: string) {
    const _p = s.split(' ');
    for (const x of _p) {
        const chrom = re_chrom.exec(x);
        if (chrom) {
            s = s.replace(x, '').trim();
            const rest = x.replace(chrom[0], '').replace(':', '');
            const range = re_range.exec(rest);
            if (range) {
                const p = range[0].replace('-', ' ').replace(':', ' ').replace(',', '').replace('.', '').split(' ');
                return {s: s, coord: {
                    chrom: chrom[0].replace('x', 'X').replace('y', 'Y'),
                    start: parseInt(p[0]),
                    end: parseInt(p[1])
                }};
            }
            const base = re_base.exec(rest);
            if (base) {
                const p = base[0].replace('-', ' ').replace(':', ' ').replace(',', '').replace('.', '').split(' ');
                return {s: s, coord: {
                    chrom: chrom[0].replace('x', 'X').replace('y', 'Y'),
                    start: parseInt(p[0]),
                    end: parseInt(p[0]) + 1
                }};
            }
            const c = chrom[0].replace('x', 'X').replace('y', 'Y');
            return {s: s, coord: {
                chrom: c,
                start: 1,
                end: chrom_lengths[assembly][c]
            }};
        }
    }
    return {s: s, coord: undefined};
}

function sanitize(q: string) {
    return q.substr(0, 2048);
}

export async function parse(assembly, args) {
    const q = args.q || '';
    const s1 = sanitize(q).trim();

    let {s, coord} = find_coord(assembly, s1);
    const toks = s.split(' ').map(t => t.toLowerCase());
    const useTss = args['tss'] || 'tssDist' in args;
    let tssDist = 0;
    if ('tssDist' in args) {
        tssDist = args['tssDist'];
    }
    let interpretation: object | undefined = {};

    const ret: object = {
    };
    if ('promoter' in toks || useTss) {
        ret['element_type'] = 'promoter-like';
        ret['rank_promoter_start'] = 1.64;
        ret['rank_dnase_start'] = 1.64;
        s = s.replace('promoter', '');
    } else if ('enhancer' in toks) {
        ret['element_type'] = 'enhancer-like';
        ret['rank_enhancer_start'] = 1.64;
        ret['rank_dnase_start'] = 1.64;
        s = s.replace('enhancer', '');
    } else if ('insulator' in toks) {
        ret['element_type'] = 'insulator-like';
        ret['rank_ctcf_start'] = 1.64;
        s = s.replace('insulator', '');
    }

    const accessions: Array<string> = [];
    const snps: Array<object> = [];
    try {
        for (const t of toks) {
            if (isaccession(t)) {
                if (!checkCreAssembly(assembly, t)) {
                    console.log('assembly mismatch', assembly, t);
                    throw new Error('mismatch assembly for accession ' + t);
                }
                accessions.push(t);
                s = s.replace(t, '');
                continue;
            } else if (t.startsWith('rs')) {
                coord = await Parse.get_snpcoord(assembly, t);
                s = s.replace(t, '');
                // TODO: add this back in
                // if (coord && !(await Parse.has_overlap(assembly, coord))) {
                //     interpretation['msg'] = `NOTICE: ${t} does not overlap any cREs; displaying any cREs within 2kb`;
                //     coord = {
                //         chrom: coord.chrom,
                //         start: Math.max(0, coord.start - 2000),
                //         end: coord.end + 2000
                //     };
                // }
                snps.push({ id: t, range: coord });
            }
        }
    } catch (e) {
        console.log('could not parse ' + s, e);
    }

    let genes: Array<GeneParse> = [];
    if (!coord && accessions.length === 0) {
        genes = await Parse.try_find_gene(assembly, s, useTss, tssDist);
        if (genes.length > 0) {
            const g = genes[0];
            interpretation['gene'] = g.get_genetext();
            coord = g.coord;
            s = g.s;
        }
    }

    let findCellType = await Parse.find_celltype(assembly, s);
    s = findCellType.s;
    let cellType = findCellType.cellType;
    let _interpretation = findCellType.interpretation;

    if (!cellType) {
        findCellType = await Parse.find_celltype(assembly, s, true);
        s = findCellType.s;
        cellType = findCellType.cellType;
        _interpretation = findCellType.interpretation;
    }

    if (0 < accessions.length) {
        coord = undefined;
        cellType = undefined;
        interpretation = undefined;
    }

    if (cellType) {
        ret['cellType'] = cellType;
    }
    if (interpretation) {
        ret['interpretation'] = interpretation;
    }
    if (coord) {
        const range = {
            chrom: coord.chrom,
            start: coord.start,
            end: coord.end
        };
        ret['range'] = range;
    }
    if (accessions.length > 0) {
        ret['accessions'] = accessions;
    }
    if (snps.length > 0) {
        ret['snps'] = snps;
    }
    if (genes.length > 1) {
        ret['genes'] = genes.map(g => g.toJson());
    } else if (genes.length === 1) {
        ret['gene'] = genes[0].toJson();
    }
    return ret;
}

export const resolve_search: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.assembly;
    const results = parse(assembly, args.search);
    return results;
};
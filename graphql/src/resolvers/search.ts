import { checkChrom, isaccession, checkCreAssembly } from '../utils';
import { GraphQLFieldResolver } from 'graphql';
import * as Parse from '../db/db_parse';
import { GeneParse } from '../db/db_parse';

const re_range = /^[cC][hH][rR][0-9XYxy][0-9]?[\s]*[\:]?[\s]*[0-9,\.]+[\s\-]+[0-9,\.]+/;
const re_base = /^[cC][hH][rR][0-9XYxy][0-9]?[\s]*[\:\s][\s]*[0-9,\.]+/;
const re_chrom = /^[cC][hH][rR][0-9XxYy][0-9]?/;

const chrom_lengths = require('../constants').chrom_lengths;
export function find_coords(assembly, s: string) {
    const coords = {};
    const unusedtoks: Array<any> = [];
    while (true) {
        if (s.length === 0) {
            break;
        }
        const _p = s.split(' ');

        const range = re_range.exec(s);
        if (range) {
            const p = range[0].replace('-', ' ').replace(':', ' ').replace(',', '').replace('.', '').split(' ');
            const coord = {
                chrom: p[0].replace('x', 'X').replace('y', 'Y'),
                start: parseInt(p[1]),
                end: parseInt(p[2])
            };
            coords[range[0]] = coord;
            s = s.replace(range[0], '').trim();
            continue;
        }

        const base = re_base.exec(s);
        if (base) {
            const p = base[0].replace('-', ' ').replace(':', ' ').replace(',', '').replace('.', '').split(' ');
            const coord = {
                chrom: p[0].replace('x', 'X').replace('y', 'Y'),
                start: parseInt(p[1]),
                end: parseInt(p[1]) + 1
            };
            coords[base[0]] = coord;
            s = s.replace(base[0], '').trim();
            continue;
        }

        const chrom = re_chrom.exec(s);
        if (chrom) {
            const coord = {
                chrom: chrom[0],
                start: 1,
                end: chrom_lengths[assembly][chrom[0]]
            };
            coords[chrom[0]] = coord;
            s = s.replace(chrom[0], '').trim();
            continue;
        }

        const [unused, ...rest] = s.split(' ');
        s = rest.join(' ').trim();
        unusedtoks.push(unused);
    }

    return {s: unusedtoks.join(' '), coords: coords};
}



function sanitize(q: string) {
    return q.substr(0, 2048);
}

export async function parse(assembly, args) {
    const q = args.q || '';
    const s1 = sanitize(q).trim();

    const rettoks: Array<any> = [];
    const {s: s2, coords} = find_coords(assembly, s1);
    Object.keys(coords).forEach(input => rettoks.push({ input, range: coords[input] }));
    let s = s2;
    const toks = s.split(' ').filter(str => str.length !== 0);
    const useTss = args['tss'] || 'tssDist' in args;
    let tssDist = 0;
    if ('tssDist' in args) {
        tssDist = args['tssDist'];
    }

    for (const t of toks) {
        const lowert = t.toLocaleLowerCase();
        try {
            if (isaccession(t)) {
                if (!checkCreAssembly(assembly, lowert)) {
                    console.log('assembly mismatch', assembly, t);
                    throw new Error('mismatch assembly for accession ' + t);
                }
                rettoks.push({ input: t, accession: t });
                s = s.replace(t, '').trim();
            } else if (lowert.startsWith('rs')) {
                const coord = await Parse.get_snpcoord(assembly, lowert);
                rettoks.push({ input: t, snp: { id: lowert, range: coord } });
                s = s.replace(t, '').trim();
            } else {
                const genes = await Parse.try_find_gene(assembly, t, useTss, tssDist);
                if (genes.length > 1) {
                    rettoks.push({ input: t, genes: genes.map(g => g.toJson()) });
                    s = s.replace(t, '').trim();
                } else if (genes.length === 1) {
                    rettoks.push({ input: t, gene: genes[0].toJson() });
                    s = s.replace(t, '').trim();
                }
            }
        } catch (e) {
            console.log('could not parse ' + t, e);
        }
    }

    const findCellType = await Parse.find_celltype(assembly, s, true);
    s = findCellType.s;
    const celltypes = findCellType.celltypes;
    Object.keys(celltypes).forEach(input => rettoks.push({ input, celltype: celltypes[input].celltype }));

    if (s.length !== 0) {
        s.split(' ').forEach(input => rettoks.push({ input, failed: true }));
    }

    return rettoks;
}

export const resolve_search: GraphQLFieldResolver<any, any> = (source, args, context) => {
    const assembly = args.assembly;
    const results = parse(assembly, args.search);
    return results;
};
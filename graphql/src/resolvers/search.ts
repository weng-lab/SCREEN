import { checkCreAssembly } from '../utils';
import * as Parse from '../db/db_parse';
import { getAccessions, getSNPs } from '../db/db_suggestions';
import { Assembly, SNP } from '../types';

const re_fullrange = /^(chr[\dxy]\d?)[\s]*[\:]?[\s]*([0-9,\.]+)?[\s\-]*([0-9,\.]+)?/i;
const re_chr_only = /^chr/i;
// an alternative with lookbehind
// const re_fullrange_partial = /^(chr[\dxy]?\d?)(?:(?<=[\dxy]\d?)(?:[\s]*[\:]?[\s]*)([0-9,\.]+)?[\s\-]*([0-9,\.]+)?)?/i
const re_accession = /^(eh37e|eh38e|em10e)\d{7}/i;
const re_accession_partial = /^(?:eh37|eh38|em10)(?:e\d{0,7})?/i;
const re_snp = /^rs[\d]+/;
const re_snp_partial = /^rs[\d]*/;

const chrom_lengths = require('../constants').chrom_lengths;

function falseOrError(shouldError, errorMessage): false {
    if (shouldError) {
        throw new Error(errorMessage);
    }
    return false;
}

function checkCoords(assembly: Assembly, coord, shouldError: boolean): boolean {
    if (!(coord.chrom in chrom_lengths[assembly])) {
        return falseOrError(shouldError, 'Invalid chromosome ' + coord.chrom);
    }
    if (coord.start < 1) {
        // This won't happen currently because of the regex
        return falseOrError(shouldError, 'Invalid start position. Should be >=1.');
    }
    const chrom_end = chrom_lengths[assembly][coord.chrom];
    if (coord.end > chrom_end) {
        return falseOrError(
            shouldError,
            `Invalid end position (${coord.end}). End of chromosome (${coord.chrom}) is ${chrom_end}`
        );
    }
    return true;
}

export function find_coords(assembly, s: string, shouldError: boolean = true, partial: boolean = false) {
    const s_in = s;
    const coords: Token[] = [];
    const unusedtoks: string[] = [];
    while (true) {
        if (s.length === 0) {
            break;
        }

        const match_fullrange = re_fullrange.exec(s);
        if (match_fullrange) {
            const start = +match_fullrange[2] || 1;

            const coord = {
                chrom: match_fullrange[1],
                start: start,
                end:
                    +match_fullrange[3] ||
                    (match_fullrange[2] ? start + 1 : chrom_lengths[assembly][match_fullrange[1]]),
            };
            s = s.replace(match_fullrange[0].trim(), '').trim();
            if (checkCoords(assembly, coord, shouldError)) {
                coords.push({ input: match_fullrange[0].trim(), sm: 1, assembly, range: coord });
            }
            continue;
        }

        if (partial) {
            const match_chr = re_chr_only.exec(s);
            if (match_chr) {
                for (const chrom of Object.keys(chrom_lengths[assembly])) {
                    const coord = {
                        chrom: chrom,
                        start: 1,
                        end: chrom_lengths[assembly][chrom],
                    };
                    coords.push({ input: match_chr[0].trim(), sm: 1, assembly, range: coord });
                    s = s.replace(match_chr[0], '').trim();
                }
                continue;
            }
        }

        const [unused, ...rest] = s.split(' ');
        s = rest.join(' ').trim();
        unusedtoks.push(unused);
    }

    return { s: !partial ? unusedtoks.join(' ') : s_in, coords };
}

export async function find_accessions(assembly, s: string, shouldError: boolean = true, partial: boolean = false) {
    const s_in = s;
    const accessions: Token[] = [];
    const unusedtoks: string[] = [];
    while (true) {
        if (s.length === 0) {
            break;
        }
        if (partial) {
            const match_accession_partial = re_accession_partial.exec(s);
            if (match_accession_partial) {
                const accession = match_accession_partial[0];
                if (checkCreAssembly(assembly, accession.toLowerCase())) {
                    const accessions_suggestions = await getAccessions(assembly, accession);
                    accessions_suggestions.forEach(suggestion => {
                        accessions.push({
                            input: accession,
                            assembly,
                            accession: suggestion.accession,
                            sm: suggestion.sm,
                        });
                    });
                    s = s.replace(accession, '').trim();
                    continue;
                }
            }
        }

        const match_accession = re_accession.exec(s);
        if (match_accession) {
            const accession = match_accession[0];
            if (!checkCreAssembly(assembly, accession.toLowerCase())) {
                falseOrError(shouldError, 'mismatch assembly for accession ' + accession);
            } else {
                accessions.push({ input: accession, sm: 1, assembly, accession: accession.toUpperCase() });
            }
            s = s.replace(accession, '').trim();
            continue;
        }

        const [unused, ...rest] = s.split(' ');
        s = rest.join(' ').trim();
        unusedtoks.push(unused);
    }

    return { s: !partial ? unusedtoks.join(' ') : s_in, accessions };
}

export async function find_snps(assembly, s: string, shouldError: boolean = true, partial: boolean = false) {
    const s_in = s;
    type SNPToken = Token & { snp: SNP };
    const snps: SNPToken[] = [];
    const unusedtoks: string[] = [];
    while (true) {
        if (s.length === 0) {
            break;
        }

        if (partial) {
            const match_snp_partial = re_snp.exec(s);
            if (match_snp_partial) {
                const snp = match_snp_partial[0];
                const snp_suggestions = await getSNPs(assembly, snp, true);
                snp_suggestions.forEach(suggestion => {
                    const range = {
                        chrom: suggestion.chrom,
                        start: suggestion.start,
                        end: suggestion.stop,
                    };
                    snps.push({
                        input: snp,
                        assembly,
                        snp: { assembly, id: suggestion.snp, range },
                        sm: suggestion.sm,
                    });
                });
                s = s.replace(snp, '').trim();
                continue;
            }
        }

        const match_snp = re_snp.exec(s);
        if (match_snp) {
            const snp = match_snp[0];
            const coord = await Parse.get_snpcoord(assembly, snp.toLowerCase());
            if (!coord) {
                falseOrError(shouldError, 'Invalid snp ' + snp);
            } else {
                snps.push({ input: snp, sm: 1, assembly, snp: { assembly, id: snp.toLowerCase(), range: coord } });
            }
            s = s.replace(snp, '').trim();
            continue;
        }

        const [unused, ...rest] = s.split(' ');
        s = rest.join(' ').trim();
        unusedtoks.push(unused);
    }

    return { s: !partial ? unusedtoks.join(' ') : s_in, snps };
}

export async function find_genes(assembly, s: string, partial: boolean = false) {
    const s_in = s;
    const genetokens: Token[] = [];
    const toks = s.split(' ').filter(str => str.length !== 0);

    for (const t of toks) {
        const genes = await Parse.try_find_gene(assembly, t);
        if (genes.length > 1) {
            const mapped = genes.map(g => g.toJson());
            genetokens.push({ input: t, sm: mapped[0].sm, assembly, genes: mapped });
            s = s.replace(t, '').trim();
        } else if (genes.length === 1) {
            genetokens.push({ input: t, sm: genes[0].sm, assembly, gene: genes[0].toJson() });
            s = s.replace(t, '').trim();
        }
    }
    return { s: !partial ? s : s_in, genetokens };
}

function sanitize(q: string) {
    return q
        .substr(0, 2048)
        .replace('\\', '')
        .replace("'", '');
}

type Token = { input: string; assembly: Assembly; sm: number; [other: string]: any };
const allAssemblies = ['hg19', 'mm10'] as Assembly[];
export async function parse(assembly: Assembly, q: string, shouldError: boolean, partial: boolean): Promise<Token[]> {
    const rettoks: Token[] = [];

    // We allow explicit separation with a comma
    for (const s1 of sanitize(q)
        .trim()
        .split(',')) {
        let s = s1;

        // Start with coords because we can use regex
        const found_coords = find_coords(assembly, s.trim(), shouldError, partial);
        s = found_coords.s;
        Object.values(found_coords.coords).forEach(token => rettoks.push(token));

        const found_accessions = await find_accessions(assembly, s.trim(), shouldError, partial);
        s = found_accessions.s;
        Object.values(found_accessions.accessions).forEach(token => rettoks.push(token));

        const found_snps = await find_snps(assembly, s.trim(), shouldError, partial);
        s = found_snps.s;
        Object.values(found_snps.snps).forEach(token => rettoks.push(token));

        const found_celltypes_ccre = await Parse.find_celltype(assembly, s, partial);
        s = found_celltypes_ccre.s;
        Object.values(found_celltypes_ccre.celltypes).forEach(token => rettoks.push(token));

        const found_genes = await find_genes(assembly, s.trim(), partial);
        s = found_genes.s;
        Object.values(found_genes.genetokens).forEach(token => rettoks.push(token));

        if (s.length !== 0 && !partial) {
            s.split(' ').forEach(input => rettoks.push({ input, sm: 1, assembly, failed: true }));
        }
    }

    return rettoks;
}

export const resolve_search = async (source, args, context) => {
    const search = args.search.q || '';
    const assembly = args.assembly;
    if (assembly) {
        return parse(assembly, search, true, false);
    } else {
        let results = [] as Token[];
        for (const assembly of allAssemblies) {
            results = results.concat(await parse(assembly, search, false, false));
        }
        return results;
    }
};

async function suggestions(query, assemblies) {
    assemblies = assemblies || ['hg19', 'mm10'];
    let results: Token[] = [];
    for (const assembly of assemblies) {
        results = results.concat(await parse(assembly, query, false, true));
    }
    results.sort((a, b) => b.sm - a.sm);
    return results;
}

export const resolve_suggestions = (source, args, context) => {
    const query = args.query;
    const assemblies = args.assemblies;
    return suggestions(query, assemblies);
};

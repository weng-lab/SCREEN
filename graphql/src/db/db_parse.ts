import { isclose } from '../utils';
import { db } from './db';
import { Assembly, Biosample, loadCache } from './db_cache';
import { biosamplesQuery } from './db_common';

export async function get_snpcoord(assembly, s) {
    const tableName = assembly + '_snps';
    const q = `
        SELECT chrom, start, stop
        FROM ${tableName}
        WHERE snp = $1
    `;
    return await db.oneOrNone(
        q,
        [s],
        r =>
            r && {
                chrom: r['chrom'],
                start: r['start'],
                end: r['stop'],
            }
    );
}

export async function has_overlap(assembly, coord) {
    const tableName = assembly + '_cre_all';
    const q = `
        SELECT accession
        FROM ${tableName}
        WHERE maxZ >= 1.64
        AND chrom = $1
        AND int4range(start, stop) && int4range($2, $3)
    `;
    const res = await db.result(q, [coord.chrom, coord.start, coord.stop]);
    return res.rowCount > 0;
}

export class GeneParse {
    assembly;
    s;
    useTss;
    tssDist;
    oname;
    strand;
    coord;
    tsscoord;
    approved_symbol;
    sm;

    constructor(assembly, r, s) {
        this.assembly = assembly;
        this.s = s;

        this.oname = r['oname'];
        this.strand = r['strand'];

        if ('+' == this.strand) {
            this.tsscoord = {
                chrom: r['altchrom'],
                start: Math.max(0, parseInt(r['altstart'])),
                end: r['altstop'],
            };
        } else {
            this.tsscoord = { chrom: r['altchrom'], start: r['altstart'], end: parseInt(r['altstop']) };
        }
        this.coord = { chrom: r['chrom'], start: r['start'], end: r['stop'] };

        this.approved_symbol = r['approved_symbol'];
        this.sm = r['sm'];
    }

    toJson() {
        return {
            oname: this.oname,
            approved_symbol: this.approved_symbol,
            range: {
                chrom: this.coord.chrom,
                start: this.coord.start,
                end: this.coord.end,
                strand: this.strand,
            },
            tssrange: {
                chrom: this.tsscoord.chrom,
                start: this.tsscoord.start,
                end: this.tsscoord.end,
                strand: this.strand,
            },
            sm: this.sm,
        };
    }

    get_genetext() {
        const gene = this.approved_symbol || this.oname;

        return {
            gene: gene,
            assembly: this.assembly,
        };
    }
}

async function exactGeneMatch(assembly, s) {
    const slo = s.toLowerCase().trim();
    const searchTableName = assembly + '_gene_search';
    const infoTableName = assembly + '_gene_info';
    const q = `
        SELECT ac.oname,
        ac.chrom, ac.start, ac.stop,
        ac.altchrom, ac.altstart, ac.altstop,
        similarity(ac.name, $1) AS sm, ac.pointer,
        gi.approved_symbol, gi.strand
        FROM ${searchTableName} ac
        INNER JOIN ${infoTableName} gi
        ON gi.id = ac.pointer
        WHERE gi.approved_symbol = $2
        ORDER BY sm DESC
        LIMIT 50
    `;
    const rows = await db.any(q, [slo, s]);
    if (rows.length > 0 && isclose(1, rows[0]['sm'])) {
        return [new GeneParse(assembly, rows[0], s)];
    }
    return rows.map(r => new GeneParse(assembly, r, s));
}

async function fuzzyGeneMatch(assembly, s) {
    const slo = s.toLowerCase().trim();
    const searchTableName = assembly + '_gene_search';
    const infoTableName = assembly + '_gene_info';
    const q = `
        SELECT ac.oname,
        ac.chrom, ac.start, ac.stop,
        ac.altchrom, ac.altstart, ac.altstop,
        similarity(ac.name, $1) AS sm, ac.pointer,
        gi.approved_symbol, gi.strand
        FROM ${searchTableName} ac
        INNER JOIN ${infoTableName} gi
        ON gi.id = ac.pointer
        WHERE gi.approved_symbol ~* $2
        ORDER BY sm DESC
        LIMIT 50
    `;
    const rows = await db.any(q, [slo, slo]);
    return rows.map(r => new GeneParse(assembly, r, s));
}

export async function try_find_gene(assembly, s) {
    let genes = await exactGeneMatch(assembly, s);
    if (genes.length === 0) {
        genes = await fuzzyGeneMatch(assembly, s);
    }
    return genes;
}

async function do_find_celltype(
    query: string,
    p: string[],
    q: string,
    unused_toks: string[],
    ret_celltypes: Record<string, queryResult>,
    possible: queryResult[]
) {
    for (const i of Array(p.length).keys()) {
        const s = p.slice(-1 * (i + 1)).join(' ');
        const r = await db.any<queryResult>(query, [s]);
        if (r.length === 0) {
            if (possible.length === 0) {
                console.assert(i === 0);
                unused_toks.unshift(s);
                q = p
                    .slice(0, -1 * (i + 1))
                    .join(' ')
                    .trim();
            } else {
                ret_celltypes[p.slice(-1 * i).join(' ')] = possible[0];
                possible.length = 0;
                q = p
                    .slice(0, -1 * i)
                    .join(' ')
                    .trim();
            }
            return q;
        }
        if (possible.length === 0) {
            // Remove duplicates
            r.forEach(
                res =>
                    (possible.map(c => c.biosample_term_name) as any).includes(res.biosample_term_name)
                        ? true
                        : possible.push(res)
            );
        } else {
            const newcelltypes = r.map(c => c.biosample_term_name);
            // Only keep results in which the celltype was not previously there, or was there and similarity increased
            const moresimilar = r.filter(res => {
                const oldres = possible.filter(old => res.biosample_term_name == old.biosample_term_name);
                if (oldres.length !== 0) {
                    // The old results contained this celltype, must make sure prob increased
                    return res.sm >= oldres[0].sm;
                } else {
                    // The old results did not contain this cell type, is it a better similarity than the best previously
                    return res.sm > possible[0].sm;
                }
            });
            if (moresimilar.length === 0) {
                // If all existing cell types reduced in similiarity and no new celltypes emerged, then adding this token does nothing helpful
                ret_celltypes[p.slice(-1 * i).join(' ')] = possible[0];
                q = p
                    .slice(0, -1 * i)
                    .join(' ')
                    .trim();
                possible.length = 0;
                return q;
            } else {
                possible.length = 0;
                moresimilar.forEach(
                    res =>
                        possible.map(c => c.biosample_term_name).includes(res.biosample_term_name)
                            ? true
                            : possible.push(res)
                );
            }
        }
    }
    return false;
}

type queryResult = {
    biosample_term_name: string;
    count: number;
    id: string[];
    type: string[];
    synonyms: string[][];
} & { sm: number };
type celltypeResult = { input: string; assembly: Assembly; sm: number; celltype: string } & Biosample;
export async function find_celltype(assembly, q, partial = false): Promise<{ s: string; celltypes: celltypeResult[] }> {
    q = q.trim();
    const s_in = q;
    if (q.length === 0) {
        return { s: q, celltypes: [] };
    }
    const query = biosamplesQuery(
        assembly,
        'WHERE LOWER(biosample_term_name) % $1 OR LOWER(biosample_term_name) ~* $1',
        [`similarity(LOWER(biosample_term_name), $1) AS sm`],
        'ORDER BY sm DESC',
        10
    );
    const rettokens: celltypeResult[] = [];
    const allbiosamples = await loadCache(assembly).biosamples();

    const unused_toks: string[] = [];
    const ret_celltypes: Record<string, queryResult> = {};
    const possible: queryResult[] = [];
    while (true) {
        if (q.length == 0) {
            break;
        }
        const p = q.trim().split(' ');
        q = await do_find_celltype(query, p, q, unused_toks, ret_celltypes, possible);

        if (!q) {
            if (possible[0]) {
                // We fell off the end, but know we have possibles
                ret_celltypes[p.join(' ')] = possible[0];
            }
            break;
        }
    }

    Object.keys(ret_celltypes).forEach(input => {
        const res = ret_celltypes[input];
        rettokens.push({
            input,
            assembly,
            sm: res.sm,
            celltype: res.biosample_term_name,
            ...allbiosamples[res.biosample_term_name],
        });
    });
    return { s: !partial ? unused_toks.join(' ') : q, celltypes: rettokens };
}

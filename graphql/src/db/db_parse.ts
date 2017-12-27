import { isclose } from '../utils';
const executeQuery = require('./db').executeQuery;

export async function get_snpcoord(assembly, s) {
    const tableName = assembly + '_snps';
    const q = `
        SELECT chrom, start, stop
        FROM ${tableName}
        WHERE snp = ${s}
    `;
    const res = await executeQuery(q);
    if (res.rows.length > 0) {
        const r = res.rows[0];
        return {
            chrom: r[0],
            start: r[1],
            end: r[2]
        };
    }
    return undefined;
}

export async function has_overlap(assembly, coord) {
    const tableName = assembly + '_cre_all';
    const q = `
        SELECT accession
        FROM ${tableName}
        WHERE maxZ >= 1.64
        AND chrom = ${coord.chrom}
        AND int4range(start, stop) && int4range(${coord.start}, ${coord.end})
    `;
    const res = await executeQuery(q);
    return res.rows.length > 0;
}

export class GeneParse {
    assembly; s; useTss;
    tssDist; oname; strand;
    coord; approved_symbol; sm;

    constructor(assembly, r, s, useTss, tssDist) {
        this.assembly = assembly;
        this.s = s;
        this.useTss = useTss;
        this.tssDist = tssDist;

        this.oname = r[0];
        this.strand = r[10];

        if (useTss) {
            if ('+' == this.strand) {
                this.coord = {chrom: r[4], start: Math.max(0, parseInt(r[5]) - tssDist), end: r[6]};
            } else {
                this.coord = {chrom: r[4], start: r[5], end: parseInt(r[6]) + tssDist};
            }
        } else {
            this.coord = {chrom: r[1], start: r[2], end: r[3]};
        }

        this.approved_symbol = r[9];
        this.sm = r[7];
    }

    toJson() {
        return {
            'oname': this.oname,
            'approved_symbol': this.approved_symbol,
            'chrom': this.coord.chrom,
            'start': this.coord.start,
            'stop': this.coord.end,
            'strand': this.strand,
            'sm': this.sm,
        };
    }

    get_genetext() {
        const gene = this.approved_symbol || this.oname;

        return {
            'gene': gene,
            'useTss': this.useTss,
            'tssDist': this.tssDist,
            'assembly': this.assembly,
        };
    }
}

async function exactGeneMatch(assembly, s, usetss, tssDist) {
    const slo = s.toLowerCase().trim();
    const searchTableName = assembly + '_gene_search';
    const infoTableName = assembly + '_gene_search';
    const q = `
        SELECT ac.oname,
        ac.chrom, ac.start, ac.stop,
        ac.altchrom, ac.altstart, ac.altstop,
        similarity(ac.name, ${slo}) AS sm, ac.pointer,
        gi.approved_symbol, gi.strand
        FROM ${searchTableName} ac
        INNER JOIN ${infoTableName} gi
        ON gi.id = ac.pointer
        WHERE gi.approved_symbol = ${s}
        ORDER BY sm DESC
        LIMIT 50
    `;
    const res = await executeQuery(q);
    const rows = res.rows;

    if (rows.length > 0 && isclose(1, rows[0][7])) {
        return [new GeneParse(assembly, rows[0], s, usetss, tssDist)];
    }
    return rows.map(r => new GeneParse(assembly, r, s, usetss, tssDist));
}

async function fuzzyGeneMatch(assembly, s, usetss, tssDist) {
    const slo = s.toLowerCase().trim();
    const searchTableName = assembly + '_gene_search';
    const infoTableName = assembly + '_gene_search';
    const q = `
        SELECT ac.oname,
        ac.chrom, ac.start, ac.stop,
        ac.altchrom, ac.altstart, ac.altstop,
        similarity(ac.name, ${slo}) AS sm, ac.pointer,
        gi.approved_symbol, gi.strand
        FROM ${searchTableName} ac
        INNER JOIN ${infoTableName} gi
        ON gi.id = ac.pointer
        WHERE gi.approved_symbol = ${slo}
        ORDER BY sm DESC
        LIMIT 50
    `;
    const res = await executeQuery(q);
    const rows = res.rows;
    return rows.map(r => new GeneParse(assembly, r, s, usetss, tssDist));
}

export async function try_find_gene(assembly, s, usetss, tssDist) {
    let genes = await exactGeneMatch(assembly, s, usetss, tssDist);
    if (genes.length === 0) {
        genes = await fuzzyGeneMatch(assembly, s, usetss, tssDist);
    }
    return genes;
}

export async function find_celltype(assembly, q, rev = false) {
    if (q.length === 0) {
        return {s: q, cellType: undefined, interpretation: undefined};
    }
    const p = q.trim().split(' ');
    let interpretation: string | undefined = undefined;
    const tableName = assembly + '_rankCellTypeIndexex';

    for (const i of Array(p.length).keys()) {
        const s = !rev ? p.slice(0, p.length - i).join(' ') : p.slice(i, p.length).join(' ');
        let query = `
            SELECT cellType, similarity(LOWER(cellType), '${s}') AS sm
            FROM ${tableName}
            WHERE LOWER(cellType) % '${s}'
            ORDER BY sm DESC
            LIMIT 1
        `;
        let res = await executeQuery(query);
        if (res.rows.length === 0) {
            query = `
                SELECT cellType
                FROM ${tableName}
                WHERE LOWER(cellType) LIKE '${s}'
                LIMIT 1
            `;
            res = await executeQuery(query);
        }
        const r = res.rows;
        if (r.length === 0) {
            continue;
        }
        if (!(r[0][0].toLowerCase().trim() in s.toLowerCase().trim()) || !(s.toLowerCase().trim() in r[0][0].toLowerCase().trim())) {
            const k = r[0][0].replace('_', ' ');
            interpretation = `Showing results for "${!interpretation ? k : interpretation + ' ' + k}"`;
        }
        return {s: !rev ? p.slice(p.length - i, p.length).join(' ') : p.slice(i, p.length).join(' '), cellType: r[0][0], interpretation};
    }
    return {s: q, cellType: undefined, interpretation: undefined};
}

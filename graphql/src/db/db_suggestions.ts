import { db } from './db';

export async function get_suggestions(assembly, suggest) {
    const tableName = assembly + '_autocomplete';
    const q = `
        SELECT oname
        FROM ${tableName}
        WHERE name LIKE $1
        LIMIT 5
    `;
    const res = await db.any(q, [suggest.toLowerCase()]);
    return res.map(r => r['oname']);
}

export async function getAccessions(assembly, accessionPartial): Promise<Array<{ accession: string; sm: number }>> {
    const tableName = assembly + '_cre_all';
    const q = `
SELECT accession, similarity(accession, $1) as sm
FROM ${tableName}
WHERE accession % $1
LIMIT 10
    `;
    return db.any(q, [accessionPartial]);
}

export async function getSNPs(
    assembly,
    snpPartial
): Promise<Array<{ snp: string; chrom: string; start: number; stop: number; sm: number }>> {
    const tableName = assembly + '_snps';
    const q = `
SELECT snp, chrom, start, stop, similarity(snp, $1) as sm
FROM ${tableName}
WHERE snp % $1
LIMIT 10
    `;
    return db.any(q, [snpPartial]);
}

export async function findGenes(assembly, genePartial) {
    const tableName = assembly + '_gene_info';
    const q = `
SELECT DISTINCT approved_symbol, similarity(approved_symbol, $1) AS sm
FROM ${tableName}
WHERE approved_symbol % $1
ORDER BY sm DESC
LIMIT 10
    `;
    return db.any(q, [`${genePartial}%`]);
}

export async function findCellTypes(assembly, ctPartial) {
    const tableName = assembly + '_rankCellTypeIndexex';
    const q = `
SELECT DISTINCT celltype, similarity(LOWER(celltype), $1) AS sm
FROM ${tableName}
WHERE LOWER(celltype) % $1
ORDER BY sm DESC
LIMIT 10
    `;
    return db.any(q, [`${ctPartial.toLowerCase()}%`]);
}

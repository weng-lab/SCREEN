import { db } from './db';

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
    snpPartial,
    partial: boolean = true
): Promise<Array<{ snp: string; chrom: string; start: number; stop: number; sm: number }>> {
    const tableName = assembly + '_snps';
    const q = `
SELECT snp, chrom, start, stop, similarity(snp, '${snpPartial}') as sm
FROM ${tableName}
WHERE snp LIKE '${snpPartial}${partial ? '%' : ''}'
ORDER BY sm DESC
LIMIT 10
    `;
    return db.any(q);
}

import { db } from './db';
import { Assembly, ChromRange, SNP } from '../types';

export async function snptable(
    assembly: Assembly,
    range: ChromRange | undefined,
    id: string | undefined
): Promise<SNP[]> {
    const tableName = assembly + '_snps';
    const wherecond: string[] = [];
    const params: Record<string, any> = {};

    if (range) {
        wherecond.push(`chrom=$<chrom> AND start>=$<start> AND stop<=$<end>`);
        params.chrom = range.chrom;
        params.start = range.start;
        params.end = range.end;
    }
    if (id) {
        wherecond.push(`snp = $<id>`);
        params.id = id;
    }
    let retwhere = '';
    if (0 < wherecond.length) {
        retwhere = 'WHERE ' + wherecond.join(' and ');
    } else {
        retwhere = 'LIMIT 50';
    }
    const q = `
        SELECT snp,chrom,start,stop
        FROM ${tableName}
        ${retwhere}
    `;
    const res = await db.any(q, params);
    const response = res.map(row => ({
        assembly,
        id: row['snp'],
        range: {
            chrom: row['chrom'],
            start: row['start'],
            end: row['stop'],
        },
    }));

    return response;
}

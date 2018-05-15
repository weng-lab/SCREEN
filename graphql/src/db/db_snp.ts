
import { db } from './db';

export async function snptable(assembly, range, id) {
    const tableName = assembly + '_snps';
    const wherecond: any[] = [],params: any = {};

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
    let retwhere ='';
    if (0 < wherecond.length) {
        retwhere = 'WHERE ' + wherecond.join(' and ');
    }
    const q = `
        SELECT snp,chrom,start,stop
        FROM ${tableName}
        ${retwhere}
    `;
    const res = await db.any(q, params);
    const response = res.map(row => ({
        id: row['snp'],
        range: {
            chrom: row['chrom'],
            start: row['start'],
            end: row['stop'],
        }
    }));

    return response;
}
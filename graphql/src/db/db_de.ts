import * as CoordUtils  from '../coord_utils';
import { db } from './db';

export async function nearbyDEs(assembly, coord, halfWindow, ct1, ct2, pval) {
    const c = CoordUtils.expanded(coord, halfWindow);
    const tableName = assembly + '_de_cts';
    let q = `
        SELECT id, deCtName FROM ${tableName}
    `;
    let res = await db.many(q);
    const ctsToId = res.reduce((obj, r) => ({ ...obj, [r['dectname']]: r['id'] }), {});

    const ct1id = ctsToId[ct1];
    const ct2id = ctsToId[ct2];

    const deTableName = assembly + '_de';
    const giTableName = assembly + '_gene_info';
    q = `
        SELECT start, stop, log2FoldChange, ensembl
        from ${deTableName} as de
        inner join ${giTableName} as gi
        on de.ensembl = gi.ensemblid
        where gi.chrom = $1
        AND de.padj <= $2
        AND int4range(gi.start, gi.stop) && int4range($3, $4)
        and de.leftCtId = $5 and de.rightCtId = $5
    `;
    res = await db.any(q, [c.chrom, pval, c.start, c.end, ct2id, ct1id]);
    if (res.length === 0) {
        res = await db.any(q, [c.chrom, pval, c.start, c.end, ct1id, ct2id]);
        res = res.map(d => ({...d, log2FoldChange: -1.0 * d['log2FoldChange']}));
    }
    return res;
}
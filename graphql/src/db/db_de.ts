import * as CoordUtils  from '../coord_utils';

const executeQuery = require('./db').executeQuery;

export async function nearbyDEs(assembly, coord, halfWindow, ct1, ct2, pval) {
    const c = CoordUtils.expanded(coord, halfWindow);
    const tableName = assembly + '_de_cts';
    let q = `
        SELECT id, deCtName FROM ${tableName}
    `;
    let res = await executeQuery(q);
    const ctsToId = (res.rows as Array<Object>).reduce((obj, r) => ({ ...obj, [r['dectname']]: r['id'] }), {});

    const ct1id = ctsToId[ct1];
    const ct2id = ctsToId[ct2];

    const deTableName = assembly + '_de';
    const giTableName = assembly + '_gene_info';
    q = `
        SELECT start, stop, log2FoldChange, ensembl
        from ${deTableName} as de
        inner join ${giTableName} as gi
        on de.ensembl = gi.ensemblid
        where gi.chrom = '${c.chrom}'
        AND de.padj <= ${pval}
        AND int4range(gi.start, gi.stop) && int4range(${c.start}, ${c.end})
        and de.leftCtId = ${ct2id} and de.rightCtId = ${ct1id}
    `;
    res = await executeQuery(q);
    let ret = res.rows;
    if (res.rows.length === 0) {
        q = `
            SELECT start, stop, log2FoldChange, ensembl
            from ${deTableName} as de
            inner join ${giTableName} as gi
            on de.ensembl = gi.ensemblid
            where gi.chrom = '${c.chrom}'
            AND de.padj <= ${pval}
            AND int4range(gi.start, gi.stop) && int4range(${c.start}, ${c.end})
            and de.leftCtId = ${ct1id} and de.rightCtId = ${ct2id}
        `;
        const res = await executeQuery(q);
        ret = res.rows.map(d => ({...d, log2FoldChange: -1.0 * d['log2FoldChange']}));
    }
    return ret;
}
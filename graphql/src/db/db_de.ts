import * as CoordUtils from '../coord_utils';
import { db } from './db';
import { getCreTable, dbcre } from './db_cre_table';
import { loadCache } from './db_cache';

export async function getCtMap(assembly) {
    const tableName = assembly + '_de_cts';
    const q = `
        SELECT id, deCtName FROM ${tableName}
    `;
    const res = await db.any(q);
    const ctsToId = res.reduce((obj, r) => ({ ...obj, [r['dectname']]: r['id'] }), {});
    return ctsToId;
}

export async function nearbyDEs(assembly, range, ct1, ct2, pval, ctmap) {
    const ct1id = ctmap[ct1];
    const ct2id = ctmap[ct2];

    const deTableName = assembly + '_de';
    const giTableName = assembly + '_gene_info';
    const q = `
        SELECT start, stop, ensembl,
            CASE WHEN leftCtId = $5 THEN log2FoldChange
                WHEN leftCtId = $6 THEN log2FoldChange * -1
            END as log2FoldChange
        from ${deTableName} as de
        inner join ${giTableName} as gi
        on de.ensembl = gi.ensemblid
        where gi.chrom = $1
        AND de.padj <= $2
        AND int4range(gi.start, gi.stop) && int4range($3, $4)
        and ((de.leftCtId = $5 and de.rightCtId = $6) or (de.leftCtId = $6 and de.rightCtId = $5))
    `;
    return db.any(q, [range.chrom, pval, range.start, range.end, ct2id, ct1id]);
}

export async function genesInRegion(assembly, chrom, start, stop) {
    const tableName = assembly + '_gene_info';
    const q = `
        SELECT ensemblid
        FROM ${tableName}
        WHERE chrom = $1
        AND int4range(start, stop) && int4range($2, $3)
        ORDER BY start
    `;

    return db.any(q, [chrom, start, stop]);
}

export async function nearbyCREs(
    assembly,
    range,
    cols,
    isProximalOrDistal
): Promise<(dbcre & { zscore_1: number; zscore_2: number })[]> {
    const ctmap = await loadCache(assembly).ctmap();
    const wheres = [`isProximal is ${isProximalOrDistal}`];
    const cres = await getCreTable(assembly, ctmap, { range }, {}, { fields: cols, wheres });
    return cres.ccres as any;
}

import * as CoordUtils from '../coord_utils';
import { db } from './db';
import { getCreTable, dbcre } from './db_cre_table';
import { loadCache } from './db_cache';
import { Assembly } from '../types';

export async function getCtMap(assembly) {
    const tableName = assembly + '_de_cts';
    const q = `
        SELECT id, deCtName FROM ${tableName}
    `;
    const res = await db.many(q);
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
    return db.any<{ start: number; stop: number; ensembl: string; log2FoldChange: number }>(q, [
        range.chrom,
        pval,
        range.start,
        range.end,
        ct2id,
        ct1id,
    ]);
}

export async function deGenes(
    assembly: Assembly,
    ct1: string,
    ct2: string,
    ensemblids: string[],
    ctmap
): Promise<({ isde: boolean; fc: number | undefined })[]> {
    const ct1id = ctmap[ct1];
    const ct2id = ctmap[ct2];

    const tableName = assembly + '_de';
    const q = `
SELECT padj,
	CASE WHEN leftCtId = $1 THEN log2FoldChange
		WHEN leftCtId = $2 THEN log2FoldChange * -1
	END as log2FoldChange
from ${tableName} as de
JOIN unnest($3) WITH ORDINALITY AS t(gene, ord)
on de.ensembl = gene
WHERE ((de.leftCtId = $1 and de.rightCtId = $2) or (de.leftCtId = $2 and de.rightCtId = $1))
ORDER BY ord ASC
    `;

    const res = await db.any<{ log2foldchange: number; padj: number }>(q, [ct2id, ct1id, ensemblids]);
    return res.map(row =>
        row.padj < 0.05
            ? {
                  isde: true,
                  fc: row.log2foldchange,
              }
            : {
                  isde: false,
                  fc: undefined,
              }
    );
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

    return db.many(q, [chrom, start, stop]);
}

export async function nearbyCREs(
    assembly,
    range,
    cols,
    isProximalOrDistal
): Promise<Array<dbcre & { zscore_1: number; zscore_2: number }>> {
    const ctmap = await loadCache(assembly).ctmap();
    const wheres = [`isProximal is ${isProximalOrDistal}`];
    const cres = await getCreTable(assembly, ctmap, { range }, {}, { fields: cols, wheres });
    return cres.cres as any[];
}

import { db } from './db';

export async function topGenes(assembly, biosample) {
    const tableNameData = assembly + '_rnaseq_expression_norm';
    const tableNameMetadata = assembly + '_rnaseq_metadata';

    const q = `
        SELECT r.tpm, ${tableNameMetadata}.organ, ${tableNameMetadata}.cellType,
        r.dataset, r.replicate, r.fpkm, ${tableNameMetadata}.ageTitle, r.id, r.gene_name
        FROM ${tableNameData} as r
        INNER JOIN ${tableNameMetadata} ON ${tableNameMetadata}.encode_id = r.dataset
        WHERE r.dataset in (select encode_id from ${tableNameMetadata} where celltype = $1)
        AND r.tpm > 1
        ORDER BY r.tpm desc
        LIMIT 1000
    `;
    const res = db.any(q, [biosample]);
    return res;
}

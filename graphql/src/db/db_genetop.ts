import { db } from './db';

export async function topGenes(assembly, biosample, normalized) {
    const tableNameData = assembly + (normalized ? '_rnaseq_expression_norm' : '_rnaseq_expression_unnorm');
    const tableNameMetadata = assembly + '_rnaseq_metadata';

    const q = `
        SELECT r.tpm, meta.organ, meta.cellType,
        r.expID, r.replicate, r.fpkm, meta.ageTitle, r.id, r.gene_name
        FROM ${tableNameData} as r
        INNER JOIN ${tableNameMetadata} AS meta ON meta.expID = r.expID AND meta.replicate = r.replicate
        WHERE r.expID in (select meta.expid where celltype = $1)
        AND r.tpm > 1
        ORDER BY r.tpm desc
        LIMIT 1000
    `;
    const res = db.any(q, [biosample]);
    return res;
}

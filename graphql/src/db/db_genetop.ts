import { db } from './db';

export async function topGenes(assembly, biosample) {
    const tableName = assembly + '_rnaseq_expression';
    const q = `
        SELECT r.tpm, ${assembly}_rnaseq_exps.organ, ${assembly}_rnaseq_exps.cellType,
        r.dataset, r.replicate, r.fpkm, ${assembly}_rnaseq_exps.ageTitle, r.id, r.gene_name
        FROM ${tableName} as r
        INNER JOIN ${assembly}_rnaseq_exps ON ${assembly}_rnaseq_exps.encode_id = r.dataset
        WHERE r.dataset in (select encode_id from ${assembly}_rnaseq_exps where celltype = $1)
        AND r.tpm > 1
        ORDER BY r.tpm desc
        LIMIT 1000
    `;
    const res = db.any(q, [biosample]);
    return res;
}

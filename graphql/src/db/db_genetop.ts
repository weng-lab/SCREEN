import { db } from './db';

export async function topGenes(assembly, biosample) {
    const tableName = 'r_expression_' + assembly;
    console.log('topgenes');
    const q = `
        SELECT r.tpm, r_rnas_${assembly}.organ, r_rnas_${assembly}.cellType,
        r.dataset, r.replicate, r.fpkm, r_rnas_${assembly}.ageTitle, r.id, r.gene_name
        FROM ${tableName} as r
        INNER JOIN r_rnas_${assembly} ON r_rnas_${assembly}.encode_id = r.dataset
        WHERE r.dataset in (select encode_id from r_rnas_${assembly} where celltype = $1)
        AND r.tpm > 1
        ORDER BY r.tpm desc
        LIMIT 1000
    `;
    const res = db.any(q, [biosample]);
    return res;
}
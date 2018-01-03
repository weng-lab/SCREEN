const executeQuery = require('./db').executeQuery;

export async function get(uuid) {
    const tableName = 'hg19_cart';
    const q = `
        SELECT accessions
        FROM ${tableName}
        WHERE uuid = '${uuid}'
    `;
    const res = await executeQuery(q);
    if (res.rows.length === 0) {
        return [];
    }
    return res.rows[0]['accessions'];
}

export async function set(uuid, accessions) {
    const tableName = 'hg19_cart';
    const selectq = `
        SELECT accessions
        FROM ${tableName}
        WHERE uuid = '${uuid}'
    `;
    const selectres = await executeQuery(selectq);
    let q;
    if (selectres.rows.length > 0) {
        q = `
            UPDATE ${tableName}
            SET accessions = '${JSON.stringify(accessions)}'
            WHERE uuid = '${uuid}'
        `;
    } else {
        q = `
            INSERT into ${tableName} (uuid, accessions)
            VALUES ('${uuid}', '${JSON.stringify(accessions)}')
        `;
    }
    const res = await executeQuery(q);
    return accessions;
}

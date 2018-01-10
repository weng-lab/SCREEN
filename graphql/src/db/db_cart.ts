import { db } from './db';

export async function get(uuid) {
    const tableName = 'hg19_cart';
    const q = `
        SELECT accessions
        FROM ${tableName}
        WHERE uuid = $1
    `;
    return db.oneOrNone(q, [uuid], r => r ? r.accessions : []);
}

export async function set(uuid, accessions) {
    const tableName = 'hg19_cart';
    const getq = `
        SELECT accessions
        FROM ${tableName}
        WHERE uuid = $1
    `;
    const existing = await db.oneOrNone(getq, [uuid], r => r && r.accessions);
    let q;
    if (existing) {
        q = `
            UPDATE ${tableName}
            SET accessions = $2:json
            WHERE uuid = $1
        `;
    } else {
        q = `
            INSERT into ${tableName} (uuid, accessions)
            VALUES ($1, $2:json)
        `;
    }
    db.query(q, [uuid, accessions]);
    return accessions;
}

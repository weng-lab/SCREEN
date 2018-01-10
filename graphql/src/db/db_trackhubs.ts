import { db } from './db';

export async function insertOrUpdate(assembly, reAccession, uid, j) {
    const getq = `
        SELECT id
        FROM search
        WHERE uid = '${uid}'
    `;
    const getres = db.oneOrNone(getq);
    if (getres) {
        const updateq = `
            UPDATE search
            SET
                reAccession = '${reAccession}',
                assembly = '${assembly}',
                hubNum = hubNum + 1,
                j = $1:json
            WHERE uid = '${uid}'
            RETURNING hubNum;
        `;
        return db.oneOrNone(updateq, [j], r => r && r['hubnum']);
    } else {
        const insertq = `
            INSERT INTO search
            (reAccession, assembly, uid, hubNum, j)
            VALUES (
                '${reAccession}',
                '${assembly}',
                '${uid}',
                0,
                $1:json
            )
            RETURNING hubNum;
        `;
        return db.oneOrNone(insertq, [j], r => r && r['hubnum']);
    }
}

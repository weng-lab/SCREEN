import { db } from './db';

export async function insertOrUpdate(assembly, reAccession, uid, j) {
    const getq = `
        SELECT id
        FROM search
        WHERE uid = '${uid}'
    `;
    const getres = await db.oneOrNone(getq);
    if (getres) {
        const updateq = `
            UPDATE search
            SET
                reAccession = '${reAccession}',
                assembly = '${assembly}',
                hubnum = hubnum + 1,
                j = $1:json
            WHERE uid = '${uid}'
            RETURNING hubnum;
        `;
        return db.oneOrNone(updateq, [j], r => r && r['hubnum']);
    } else {
        const insertq = `
            INSERT INTO search
            (reaccession, assembly, uid, hubnum, j)
            VALUES (
                '${reAccession}',
                '${assembly}',
                '${uid}',
                0,
                $1:json
            )
            RETURNING hubnum;
        `;
        return db.oneOrNone(insertq, [j], r => r && r['hubnum']);
    }
}

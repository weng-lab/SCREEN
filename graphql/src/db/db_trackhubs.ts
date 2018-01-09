const executeQuery = require('./db').executeQuery;

export async function insertOrUpdate(assembly, reAccession, uid, j) {
    const getq = `
        SELECT id
        FROM search
        WHERE uid = '${uid}'
    `;
    const getres = await executeQuery(getq);
    if (getres.rows.length > 0) {
        const updateq = `
            UPDATE search
            SET
                reAccession = '${reAccession}',
                assembly = '${assembly}',
                hubNum = hubNum + 1,
                j = $1
            WHERE uid = '${uid}'
            RETURNING hubNum;
        `;
        const updateres = await executeQuery(updateq, [JSON.stringify(j)]);
        return updateres.rows[0]['hubnum'];
    } else {
        const insertq = `
            INSERT INTO search
            (reAccession, assembly, uid, hubNum, j)
            VALUES (
                '${reAccession}',
                '${assembly}',
                '${uid}',
                0,
                $1
            )
            RETURNING hubNum;
        `;
        const insertres = await executeQuery(insertq, [JSON.stringify(j)]);
        return insertres.rows[0]['hubnum'];
    }
}

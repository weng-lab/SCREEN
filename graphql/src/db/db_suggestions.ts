import { db } from './db';

export async function get_suggestions(assembly, suggest) {
    const tableName = assembly + '_autocomplete';
    const q = `
        SELECT oname
        FROM ${tableName}
        WHERE name LIKE $1
        LIMIT 5
    `;
    const res = await db.any(q, [suggest.toLowerCase()]);
    if (res.length === 0) {
        console.log(`no results for ${suggest} in ${assembly}`);
    }
    return res.map(r => r['oname']);
}

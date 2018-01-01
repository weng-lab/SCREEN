const executeQuery = require('./db').executeQuery;

export async function get_suggestions(assembly, suggest) {
    const tableName = assembly + '_autocomplete';
    const q = `
        SELECT oname
        FROM ${tableName}
        WHERE name LIKE '${suggest}' || '%%'
        LIMIT 5
    `;
    const res = await executeQuery(q);
    if (res.rows.length === 0) {
        console.log(`no results for ${suggest} in ${assembly}`);
    }
    return res.rows.map(r => r['oname']);
}

const { Pool } = require('pg');

const config = require('../config.json');
const pool = new Pool(config.DB);

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

module.exports.pool = pool;

async function executeQuery(query, values) {
    try {
        const res = await pool.query(query, values);
        return res;
    } catch (e) {
        console.error('Error when executing query: ', query, values ? ' with values: ' : '', values ? values : '');
        console.error(e);
        throw e;
    }
}

module.exports.executeQuery = executeQuery;

require('./db_cache');


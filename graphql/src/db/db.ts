const { Pool } = require('pg');

const config = require('../config.json');
const pool = new Pool(config.DB);

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

module.exports.pool = pool;

async function executeQuery(query) {
    try {
        const res = await pool.query(query);
        return res;
    } catch (e) {
        console.error('Error when executing query: ', query);
        return {rows: []};
    }
}

module.exports.executeQuery = executeQuery;

require('./db_cache');


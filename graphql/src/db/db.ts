const { Pool } = require('pg');

const config = require('../config.json') || {};
const pool = new Pool(config);

// the pool with emit an error on behalf of any idle clients
// it contains if a backend error or network partition happens
pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
});

require('./db_cache');

module.exports.pool = pool;
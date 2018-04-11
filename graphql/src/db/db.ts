import { IDatabase } from 'pg-promise';

const Raven = require('raven');

const initOptions = {
    error(err, e) {
        if (e.cn) {
            Raven.captureException(err);
            console.log('Connection error: ', err);
            return;
        }
        console.error('Error when executing query: ', e.query, e.params ? ' with params: ' : '', e.params ? e.params : '');
        Raven.captureException(err, { extra: { query: e.query, params: e.params }});

    },
    query(e) {
        // console.log('QUERY:', e.query);
    }
};

const config = require('../config.json');

export const pgp = require('pg-promise')(initOptions);
export const db: IDatabase<any> = pgp({ ...config.DB, application_name: 'graphqlapi' });

require('./db_cache');

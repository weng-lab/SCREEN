import { IDatabase } from 'pg-promise';

const initOptions = {
    error(err, e) {
        if (e.cn) {
            console.log('Connection error: ', err);
            return;
        }
        console.error('Error when executing query: ', e.query, e.params ? ' with params: ' : '', e.params ? e.params : '');
      }
};

const config = require('../config.json');

const pgp = require('pg-promise')(initOptions);
export const db: IDatabase<any> = pgp(config.DB);

require('./db_cache');

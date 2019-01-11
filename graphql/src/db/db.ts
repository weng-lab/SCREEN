import { IDatabase } from 'pg-promise';
import config from '../config.json';
import Raven from 'raven';

const initOptions = {
    error(err, e) {
        if (e.cn) {
            Raven.captureException(err);
            console.log('Connection error: ', err);
            return;
        }
        console.error(
            'Error when executing query: ',
            e.query,
            e.params ? ' with params: ' : '',
            e.params ? e.params : ''
        );
        Raven.captureException(err, { extra: { query: e.query, params: e.params } });
    },
    query(e) {
        // console.log('QUERY:', e.query);
    },
};

export const pgp = require('pg-promise')(initOptions);
// 1005, 1006, 1007 for _int array
pgp.pg.types.setTypeParser(1005, 'text', val => val.split(/,/).map(n => parseInt(n.replace(/[\{\[\]\}]/, ''))));
pgp.pg.types.setTypeParser(1006, 'text', val => val.split(/,/).map(n => parseInt(n.replace(/[\{\[\]\}]/, ''))));
pgp.pg.types.setTypeParser(1007, 'text', val => val.split(/,/).map(n => parseInt(n.replace(/[\{\[\]\}]/, ''))));
// 1021 is the oid for _float4 which is a float array
pgp.pg.types.setTypeParser(1021, 'text', val => val.split(/,/).map(n => parseFloat(n.replace(/[\{\[\]\}]/, ''))));
pgp.pg.types.setTypeParser(1022, 'text', val => val.split(/,/).map(n => parseFloat(n.replace(/[\{\[\]\}]/, ''))));
export const db: IDatabase<any> = pgp({ ...config.DB, application_name: 'graphqlapi' });

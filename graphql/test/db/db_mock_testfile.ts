import { db } from '../../src/db/db';

export const test_db = async () => {
    const result = await db.any('SELECT now()');
    return result;
};

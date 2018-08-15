// This file provides a template for mocking db calls, as well as tests that the mocking works

// This must be placed before any imports
jest.mock('../../src/db/db');

import { db } from '../../src/db/db';
import { test_db } from './db_mock_testfile';

describe('db', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });
    it('returns undefined when mocked (current file)', async () => {
        jest.spyOn(db, 'any').mockImplementation(() => Promise.resolve('mocked_current'));
        const result = await db.any('SELECT now()');
        expect(result).toBe('mocked_current');
    });

    it('returns undefined when mocked (other files)', async () => {
        jest.spyOn(db, 'any').mockImplementation(() => Promise.resolve('mocked_other'));
        const result = await test_db();
        expect(result).toBe('mocked_other');
    });
});

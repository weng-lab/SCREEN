import * as parse from '../src/db/db_parse';

describe('find_celltype', () => {
beforeAll(() => {
    return require('../src/db/db');
});

test('single token', async () => {
    expect.assertions(3);
    const data = await parse.find_celltype('hg19', 'K562');
    const expected = {
        s: '',
        celltypes: [
            expect.objectContaining({ assembly: 'hg19', celltype: 'K562', input: 'K562', sm: 1 }),
        ],
    };
    expect(Object.keys(data)).toEqual(Object.keys(expected));
    expect(data.s).toEqual(expected.s);
    expect(data.celltypes).toEqual(expected.celltypes);
});

test('two tokens', async () => {
    expect.assertions(3);
    const data = await parse.find_celltype('hg19', 'K562 A549');
    const expected = {
        s: '',
        celltypes: [
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549', input: 'A549', sm: 1 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549 treated with ethanol', input: 'A549', sm: 0.192308 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549 treated with dexamethasone', input: 'A549', sm: 0.15625 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'K562', input: 'K562', sm: 1 }),
        ],
    };
    expect(Object.keys(data)).toEqual(Object.keys(expected));
    expect(data.s).toEqual(expected.s);
    expect(data.celltypes).toEqual(expected.celltypes);
});

test('two token cell type', async () => {
    expect.assertions(3);
    const data = await parse.find_celltype('hg19', 'A549 ethanol');
    const expected = {
        s: '',
        celltypes: [
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549 treated with ethanol', input: 'A549 ethanol', sm: .5 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549', input: 'A549 ethanol', sm: .384615 }),
        ]
    };
    expect(Object.keys(data)).toEqual(Object.keys(expected));
    expect(data.s).toEqual(expected.s);
    expect(data.celltypes).toEqual(expected.celltypes);
});

// In order to be able to separate cell types, this doesn't work
test('two token cell type reverse', async () => {
    expect.assertions(3);
    const data = await parse.find_celltype('hg19', 'ethanol A549');

    const expected = {
        s: '',
        celltypes: [
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549 treated with ethanol', input: 'ethanol A549', sm: .5 }),
        ]
    };
    expect(Object.keys(data)).toEqual(Object.keys(expected));
    expect(data.s).toEqual(expected.s);
    expect(data.celltypes).toEqual(expected.celltypes);
});

test('two cell types multiple tokens', async () => {
    expect.assertions(3);
    const data = await parse.find_celltype('hg19', 'K562 A549 ethanol');

    const expected = {
        s: '',
        celltypes: [
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549 treated with ethanol', input: 'A549 ethanol', sm: .5 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549', input: 'A549 ethanol', sm: .384615 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'K562', input: 'K562', sm: 1 }),
        ]
    };
    expect(Object.keys(data)).toEqual(Object.keys(expected));
    expect(data.s).toEqual(expected.s);
    expect(data.celltypes).toEqual(expected.celltypes);
});

test('two cell types multiple tokens extra', async () => {
    expect.assertions(3);
    const data = await parse.find_celltype('hg19', 'K562 100 A549 ethanol');

    const expected = {
        s: '100',
        celltypes: [
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549 treated with ethanol', input: 'A549 ethanol', sm: .5 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549', input: 'A549 ethanol', sm: .384615 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'K562', input: 'K562', sm: 1 }),
        ]
    };
    expect(Object.keys(data)).toEqual(Object.keys(expected));
    expect(data.s).toEqual(expected.s);
    expect(data.celltypes).toEqual(expected.celltypes);
});

test('two cell types multiple tokens interrupted', async () => {
    expect.assertions(3);
    const data = await parse.find_celltype('hg19', 'K562 A549 100 ethanol');

    const expected = {
        s: '100',
        celltypes: [
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549 treated with ethanol', input: 'ethanol', sm: .307692 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549', input: 'A549', sm: 1 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549 treated with ethanol', input: 'A549', sm: .192308 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'A549 treated with dexamethasone', input: 'A549', sm: .15625 }),
            expect.objectContaining({ assembly: 'hg19', celltype: 'K562', input: 'K562', sm: 1 }),
        ]
    };
    expect(Object.keys(data)).toEqual(Object.keys(expected));
    expect(data.s).toEqual(expected.s);
    expect(data.celltypes).toEqual(expected.celltypes);
});

// One more edge case. If there is extra input after that doesn't change results, but only lowers sm, lower sm result will be displayed
test('extra unnecessary', async () => {
    expect.assertions(5);
    const data = await parse.find_celltype('hg19', 'K562 1');

    const expected = {
        s: '',
        celltypes: [
            expect.objectContaining({ assembly: 'hg19', celltype: 'K562', input: 'K562 1', sm: .714286 }),
        ]
    };
    const notexpected = {
        s: '1',
        celltypes: [
            expect.objectContaining({ assembly: 'hg19', celltype: 'K562', input: 'K562', sm: 1 }),
        ]
    };
    expect(Object.keys(data)).toEqual(Object.keys(expected));
    expect(data.s).toEqual(expected.s);
    expect(data.celltypes).toEqual(expected.celltypes);

    expect(data.s).not.toEqual(notexpected.s);
    expect(data.celltypes).not.toEqual(notexpected.celltypes);
});

test('partial', async () => {
    expect.assertions(3);
    const data = await parse.find_celltype('hg19', 'K5');

    const expected = {
        s: '',
        celltypes: [
            expect.objectContaining({ assembly: 'hg19', celltype: 'K562', input: 'K5', sm: .333333 }),
        ]
    };
    expect(Object.keys(data)).toEqual(Object.keys(expected));
    expect(data.s).toEqual(expected.s);
    expect(data.celltypes).toEqual(expected.celltypes);
});
});
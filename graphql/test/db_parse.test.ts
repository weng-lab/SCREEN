import * as parse from '../src/db/db_parse';

beforeAll(() => {
    return require('../src/db/db');
});

test('single token', async () => {
    expect.assertions(1);
    const data = await parse.find_celltype('hg19', 'K562', true);
    expect(data).toEqual({ s: '', celltypes: {
            'K562': { celltype: 'K562', sm: 1 },
        }});
});

test('two tokens', async () => {
    expect.assertions(1);
    const data = await parse.find_celltype('hg19', 'K562 A549', true);
    expect(data).toEqual({ s: '', celltypes: {
            'K562': { celltype: 'K562', sm: 1 },
            'A549': { celltype: 'A549', sm: 1 },
        }});
});

test('two token cell type', async () => {
    expect.assertions(1);
    const data = await parse.find_celltype('hg19', 'A549 ethanol', true);
    expect(data).toEqual({ s: '', celltypes: {
            'A549 ethanol': { celltype: 'A549_treated_with_ethanol', sm: .5 },
        }});
});

// In order to be able to separate cell types, this doesn't work
test('two token cell type reverse', async () => {
    expect.assertions(2);
    const data = await parse.find_celltype('hg19', 'ethanol A549', true);
    expect(data).not.toEqual({ s: '', celltypes: {
            'ethanol A549': { celltype: 'A549_treated_with_ethanol', sm: .5 },
        }});
    expect(data).toEqual({ s: '', celltypes: {
        'ethanol': { celltype: 'A549_treated_with_ethanol', sm: .307692 },
        'A549': { celltype: 'A549', sm: 1 },
    }});
});

test('two cell types multiple tokens', async () => {
    expect.assertions(1);
    const data = await parse.find_celltype('hg19', 'K562 A549 ethanol', true);
    expect(data).toEqual({ s: '', celltypes: {
            'K562': { celltype: 'K562', sm: 1 },
            'A549 ethanol': { celltype: 'A549_treated_with_ethanol', sm: .5 },
        }});
});

test('two cell types multiple tokens extra', async () => {
    expect.assertions(1);
    const data = await parse.find_celltype('hg19', 'K562 100 A549 ethanol', true);
    expect(data).toEqual({ s: '100', celltypes: {
            'K562': { celltype: 'K562', sm: 1 },
            'A549 ethanol': { celltype: 'A549_treated_with_ethanol', sm: .5 },
        }});
});

test('two cell types multiple tokens interrupted', async () => {
    expect.assertions(1);
    const data = await parse.find_celltype('hg19', 'K562 A549 100 ethanol', true);
    expect(data).toEqual({ s: '100', celltypes: {
            'K562': { celltype: 'K562', sm: 1 },
            'ethanol': { celltype: 'A549_treated_with_ethanol', sm: .307692 },
            'A549': { celltype: 'A549', sm: 1 },
        }});
});

// One more edge case. If there is extra input after that doesn't change results, but only lowers sm, lower sm result will be displayed
test('extra unnecessary', async () => {
    expect.assertions(2);
    const data = await parse.find_celltype('hg19', 'K562 1', true);
    expect(data).not.toEqual({ s: '1', celltypes: {
            'K562': { celltype: 'K562', sm: 1 },
        }});
    expect(data).toEqual({ s: '', celltypes: {
        'K562 1': { celltype: 'K562', sm: .714286 },
    }});
});

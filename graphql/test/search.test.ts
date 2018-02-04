import * as search from '../src/resolvers/search';

test('range single token', () => {
    expect(search.find_coords('hg19', 'chr1:1-100')).toEqual({ coords: { 'chr1:1-100': { chrom: 'chr1', start: 1, end: 100}}, s: '' });
});

test('base single token', () => {
    expect(search.find_coords('hg19', 'chr1:1')).toEqual({ coords: {'chr1:1': { chrom: 'chr1', start: 1, end: 2}}, s: ''});
});

test('chr single token', () => {
    expect(search.find_coords('hg19', 'chr1')).toEqual({ coords: {'chr1': { chrom: 'chr1', start: 1, end: 249250621}}, s: ''});
});

test('range two token', () => {
    expect(search.find_coords('hg19', 'chr1:1-100 chr2:1-100'))
    .toEqual({ coords: {'chr1:1-100': { chrom: 'chr1', start: 1, end: 100}, 'chr2:1-100': { chrom: 'chr2', start: 1, end: 100}}, s: '' });
});

test('base two token', () => {
    expect(search.find_coords('hg19', 'chr1:1 chr2:1'))
    .toEqual({ coords: {'chr1:1': { chrom: 'chr1', start: 1, end: 2}, 'chr2:1': { chrom: 'chr2', start: 1, end: 2}}, s: ''});
});

test('chr two token', () => {
    expect(search.find_coords('hg19', 'chr1 chr2'))
    .toEqual({ coords: {'chr1': { chrom: 'chr1', start: 1, end: 249250621}, 'chr2': { chrom: 'chr2', start: 1, end: 243199373}}, s: ''});
});

test('range one split token', () => {
    expect(search.find_coords('hg19', 'chr1 1-100'))
    .toEqual({ coords: {'chr1 1-100': { chrom: 'chr1', start: 1, end: 100}}, s: '' });
});

test('range split intterupted', () => {
    expect(search.find_coords('hg19', 'chr1 K562 1-100'))
    .toEqual({ coords: {'chr1': { chrom: 'chr1', start: 1, end: 249250621}}, s: 'K562 1-100' });
});

test('range split intterupted plus extra', () => {
    expect(search.find_coords('hg19', 'chr1 K562 1-100 chr2 2-101'))
    .toEqual({ coords: {'chr1': { chrom: 'chr1', start: 1, end: 249250621}, 'chr2 2-101': { chrom: 'chr2', start: 2, end: 101}}, s: 'K562 1-100' });
});

test('complex', () => {
    expect(search.find_coords('hg19', 'chr1 K562 1 100 chr2 2-101 chr3 1 A549 chr4:1 50'))
    .toEqual({ coords: {
        'chr1': { chrom: 'chr1', start: 1, end: 249250621},
        'chr2 2-101': { chrom: 'chr2', start: 2, end: 101},
        'chr3 1': { chrom: 'chr3', start: 1, end: 2},
        'chr4:1 50': { chrom: 'chr4', start: 1, end: 50},
    }, s: 'K562 1 100 A549' });
});
